import { updateDashboard } from './dashboard.js';
import { showToast } from './alerts.js';
import { showConfirmModal } from './modals.js';
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

let currentFilter = 'pending'; // 'pending' | 'all'

/* ======================================================
   INIT — REALTIME SYNC (VIA STORE)
====================================================== */

store.addEventListener('tasksUpdated', (e) => {
    const tasks = e.detail;
    renderTasks(tasks); 
    updateEmptyState(tasks);
    updateDashboard(tasks);
});

/* ======================================================
   FILTER EVENTS
====================================================== */

document.addEventListener('filterTasks', e => {
  currentFilter = e.detail.filter;
  renderTasks(store.getTasks());
  updateListHeader();
});

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
  const visibleTasks = getFilteredTasks(tasks);

  const fragment = document.createDocumentFragment();

  visibleTasks.forEach(task => {
    fragment.appendChild(
      createTaskElement(task, categoriesMap)
    );
  });

  taskListUl.appendChild(fragment);
}

function getFilteredTasks(tasks) {
  if (currentFilter === 'pending') {
    return tasks.filter(t => !t.completed);
  }
  return tasks;
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
  const header = document.querySelector('.list-tasks h1');
  if (!header) return;

  header.textContent =
    currentFilter === 'all' ? 'All Tasks' : 'Pending Tasks';
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
