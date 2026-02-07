import { updateDashboard } from './dashboard.js';
import { showToast } from './alerts.js';
import { showConfirmModal, showEditTaskModal } from './modals.js';
import { dbService } from '../services/db.js';
import { validateTask } from '../utils/validators.js';
import { store } from '../store.js';

/* ======================================================
   DOM REFERENCES
====================================================== */

const form = document.querySelector('.add-task');
const titleInput = document.querySelector('#title');
const descriptionInput = document.querySelector('#description');
const dateInput = document.querySelector('#due-date');
const taskListUl = document.querySelector('.list-tasks .list-tasks-ul');
const noTasksMessage = document.querySelector('.no-tasks-message');

/* ======================================================
   STATE
====================================================== */

let filterState = {
    status: 'pending',
    search: '',
    category: 'all',
    priority: 'all'
};

/* ======================================================
   INIT — REALTIME SYNC (VIA STORE)
====================================================== */

store.addEventListener('tasksUpdated', (e) => {
    const tasks = e.detail;
    populateCategoryFilter(); // Ensure categories are up to date
    renderTasks(tasks); 
    updateEmptyState(tasks);
    updateDashboard(tasks);
});

/* ======================================================
   FILTER EVENTS
====================================================== */

// Global event for routing side-effects
document.addEventListener('filterTasks', e => {
  filterState.status = e.detail.filter;
  const statusSelect = document.querySelector('#task-filter-status');
  if(statusSelect) statusSelect.value = filterState.status;
  
  renderTasks(store.getTasks());
  updateListHeader();
});

// Local Filter UI Events
function initFilterListeners() {
    const searchInput = document.querySelector('#task-search');
    const statusSelect = document.querySelector('#task-filter-status');
    const categorySelect = document.querySelector('#task-filter-category');
    const prioritySelect = document.querySelector('#task-filter-priority');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterState.search = e.target.value.toLowerCase();
            renderTasks();
        });
    }

    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            filterState.status = e.target.value;
            renderTasks();
            updateListHeader();
        });
    }

    if (prioritySelect) {
        prioritySelect.addEventListener('change', (e) => {
            filterState.priority = e.target.value;
            renderTasks();
        });
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            filterState.category = e.target.value;
            renderTasks();
        });
    }
}

// Call on load
function init() {
    populateCategoryFilter();
    initFilterListeners();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function populateCategoryFilter() {
    const categorySelect = document.querySelector('#task-filter-category');
    if (!categorySelect) return;

    // Keep current selection if possible
    const currentVal = categorySelect.value;
    
    // Clear except first option
    while(categorySelect.options.length > 1) {
        categorySelect.remove(1);
    }

    const customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];
    
    // Default categories if needed, or just custom ones
    // Assuming customCategories contains all available categories
    
    customCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.textContent = cat.label || cat.value; 
        categorySelect.appendChild(option);
    });

    // Restore value if it still exists
    if(filterState.category !== 'all') {
         // Check if option exists
         const exists = [...categorySelect.options].some(o => o.value === filterState.category);
         if(exists) categorySelect.value = filterState.category;
         else {
             categorySelect.value = 'all'; 
             filterState.category = 'all';
         }
    }
}

/* ======================================================
   FORM SUBMISSION
====================================================== */

if (form) {
  form.addEventListener('submit', handleFormSubmit);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const categoryInput = document.querySelector('#task-category');

  const formData = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    dueDate: dateInput.value,
    category: categoryInput?.value || 'Uncategorized'
  };

  const errors = validateTask(formData);
  if (errors.length) {
    showToast(
      `Please fix the following errors:\n- ${errors.join('\n- ')}`,
      'error',
      'Validation Failed'
    );
    return;
  }

  const newTask = {
    ...formData,
    createdAt: new Date().toISOString(),
    completedAt: null,
    completed: false
  };

  // Optimistic UX Update via Store
  store.optimisticAddTask(newTask);
  
  showToast('Task created successfully!', 'success');
  form.reset();
  resetCategorySelect(categoryInput);

  dbService.addTask(newTask).catch(err => {
    console.error(err);
    showToast('Error creating task', 'error');
  });
}

/* ======================================================
   RENDERING — TASK LIST
====================================================== */

function renderTasks(tasksToRender) {
  if (!taskListUl) return;

  // Use passed tasks or fetch from store
  const tasks = tasksToRender || store.getTasks();

  taskListUl.innerHTML = '';

  const categoriesMap = loadCategoriesMap();
  const visibleTasks = getFilteredTasks(tasks, categoriesMap);

  const fragment = document.createDocumentFragment();

  visibleTasks.forEach(task => {
    fragment.appendChild(
      createTaskElement(task, categoriesMap)
    );
  });

  taskListUl.appendChild(fragment);
}

function getFilteredTasks(tasks, categoriesMap) {
  return tasks.filter(t => {
      // 1. Status Filter
      if (filterState.status === 'pending' && t.completed) return false;
      if (filterState.status === 'completed' && !t.completed) return false;

      // 2. Category Filter
      if (filterState.category !== 'all' && t.category !== filterState.category) return false;

      // 3. Priority Filter (Requires Category Look-up)
      if (filterState.priority !== 'all') {
          // If a category map wasn't passed, we can't filter reliably, but usually it is passed.
          // Note: If t.category isn't in map (deleted?) treat as no priority.
          const cat = categoriesMap?.get(t.category);
          const taskPriority = cat?.priority || 'none'; 
          if (taskPriority !== filterState.priority) return false;
      }

      // 4. Search Filter
      if (filterState.search) {
          const matchTitle = t.title.toLowerCase().includes(filterState.search);
          const matchDesc = t.description?.toLowerCase().includes(filterState.search);
          if (!matchTitle && !matchDesc) return false;
      }

      return true;
  });
}

/* ======================================================
   TASK ELEMENT
====================================================== */

function createTaskElement(task, categoriesMap) {
  const li = document.createElement('li');

  li.dataset.id = task.id;
  li.id = task.id; // Para navegação direta
  li.className = 'schedule-item';
  li.classList.toggle('completed', task.completed);

  const category = categoriesMap.get(task.category);
  const priorityDot = category?.priority
    ? `<span class="priority-dot ${category.priority}" title="Priority: ${category.priority}"></span>`
    : '';

  li.innerHTML = `
    <div class="task-header">
      <div class="status-task"></div>
      <input class="input-checkbox" type="checkbox" ${task.completed ? 'checked' : ''}>
      <span class="name-task">${priorityDot}${task.title}</span>
      <span class="date-task">Due: ${task.dueDate}</span>
    </div>

    <div class="description">
      <span>${task.description}</span>
      <p class="task-category">Category: ${task.category}</p>
    </div>

    <div class="controls">
      <button class="edit-button">Edit</button>
      <button class="delete-button">Delete</button>
    </div>
  `;

  attachTaskEvents(li, task);
  return li;
}

/* ======================================================
   TASK EVENTS
====================================================== */

function attachTaskEvents(li, task) {
  // Expand / collapse
  li.addEventListener('click', e => {
    if (e.target.type === 'checkbox' || e.target.tagName === 'BUTTON') return;

    li.classList.toggle('focused');
    li.querySelector('.description')?.classList.toggle('expanded');
    li.querySelector('.controls')?.classList.toggle('expanded');
    li.querySelector('.status-task')?.classList.toggle('active');
  });

  // Completion
  li.querySelector('.input-checkbox').addEventListener('change', e => {
    e.stopPropagation();

    dbService.updateTask(task.id, {
      completed: e.target.checked,
      completedAt: e.target.checked ? new Date().toISOString() : null
    });
  });

  // Edit
  li.querySelector('.edit-button').addEventListener('click', e => {
    e.stopPropagation();

    showEditTaskModal(task, (updatedTask) => {
        dbService.updateTask(task.id, updatedTask);
        showToast('Task updated successfully', 'success');
    });
  });

  // Deletion
  li.querySelector('.delete-button').addEventListener('click', e => {
    e.stopPropagation();

    showConfirmModal({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete',
      onConfirm: () => {
        dbService.deleteTask(task.id);
        showToast('Task deleted successfully', 'success');
      }
    });
  });
}

/* ======================================================
   UI HELPERS
====================================================== */

function updateListHeader() {
  const header = document.querySelector('#tasks-title');
  if (!header) return;

  const titles = {
      'all': 'All Tasks',
      'pending': 'Pending Tasks',
      'completed': 'Completed Tasks'
  };
  
  header.textContent = titles[filterState.status] || 'Tasks';
}

function updateEmptyState(tasks) {
  if (!noTasksMessage) return;
  const currentTasks = tasks || store.getTasks();
  noTasksMessage.classList.toggle('active', currentTasks.length === 0);
}

function resetCategorySelect(categoryInput) {
  const selectedDiv = document.querySelector('.select-selected');
  if (selectedDiv) selectedDiv.textContent = 'Select Category';
  if (categoryInput) categoryInput.value = '';
}

/* ======================================================
   DATA HELPERS
====================================================== */

function loadCategoriesMap() {
  const customCategories =
    JSON.parse(localStorage.getItem('customCategories')) || [];

  return new Map(customCategories.map(c => [c.value, c]));
}
