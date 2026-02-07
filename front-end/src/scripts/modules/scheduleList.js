import { showToast } from './alerts.js';
import { showConfirmModal, showEditScheduleModal } from './modals.js';
import { dbService } from '../services/db.js';
import { store } from '../store.js';

/* ======================================================
   DOM REFERENCES
====================================================== */

const scheduleListUl = document.querySelector('.list-schedules-ul');
const noSchedulesMessage = document.querySelector('.no-schedules-message');

/* ======================================================
   STATE
====================================================== */

let filterState = {
    status: 'pending',
    search: '',
    category: 'all'
};

/* ======================================================
   INIT
====================================================== */

export function initScheduleList() {
  store.addEventListener('schedulesUpdated', (e) => {
    const schedules = e.detail;
    populateCategoryFilter();
    renderSchedules(schedules);
    updateEmptyState(schedules);
  });
  
  initFilterListeners();
  // Initial population could also happen here if store is ready, 
  // but usually relies on customCategories which might be in localStorage.
  populateCategoryFilter();
}

function initFilterListeners() {
    const searchInput = document.querySelector('#schedule-search');
    const statusSelect = document.querySelector('#schedule-filter-status');
    const categorySelect = document.querySelector('#schedule-filter-category');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterState.search = e.target.value.toLowerCase();
            renderSchedules();
        });
    }

    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            filterState.status = e.target.value;
            renderSchedules();
            updateListHeader();
        });
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            filterState.category = e.target.value;
            renderSchedules();
        });
    }
}

function updateListHeader() {
  const header = document.querySelector('#schedules-title');
  if (!header) return;

  const titles = {
      'all': 'All Schedules',
      'pending': 'Pending Schedules',
      'completed': 'Completed Schedules'
  };
  
  header.textContent = titles[filterState.status] || 'Schedules';
}

function populateCategoryFilter() {
    const categorySelect = document.querySelector('#schedule-filter-category');
    if (!categorySelect) return;

    // Keep current selection
    const currentVal = filterState.category;
    
    // Clear except first option
    while(categorySelect.options.length > 1) {
        categorySelect.remove(1);
    }

    const customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];
    
    customCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.textContent = cat.label || cat.value;
        categorySelect.appendChild(option);
    });

    // Restore value
    if (currentVal !== 'all') {
         const exists = [...categorySelect.options].some(o => o.value === currentVal);
         if(exists) categorySelect.value = currentVal;
         else {
             categorySelect.value = 'all';
             filterState.category = 'all';
         }
    }
}

/* ======================================================
   RENDERING — LIST
====================================================== */

function renderSchedules(schedules) {
  if (!scheduleListUl) return;
  // Fallback to store if not passed
  const allSchedules = schedules || store.getSchedules();
  
  const currentSchedules = getFilteredSchedules(allSchedules);

  scheduleListUl.innerHTML = '';

  const categoriesMap = loadScheduleCategories();
  const fragment = document.createDocumentFragment();

  currentSchedules.forEach(schedule => {
    fragment.appendChild(
      createScheduleElement(schedule, categoriesMap)
    );
  });

  scheduleListUl.appendChild(fragment);
}

function getFilteredSchedules(schedules) {
  return schedules.filter(s => {
      // 1. Status Filter
      if (filterState.status === 'pending' && s.completed) return false;
      if (filterState.status === 'completed' && !s.completed) return false;

      // 2. Category Filter
      if (filterState.category !== 'all' && s.category !== filterState.category) return false;

      // 3. Search Filter
      if (filterState.search) {
          const matchTitle = s.title.toLowerCase().includes(filterState.search);
          const matchDesc = s.description?.toLowerCase().includes(filterState.search);
          if (!matchTitle && !matchDesc) return false;
      }

      return true;
  });
}

/* ======================================================
   SCHEDULE ITEM
====================================================== */

function createScheduleElement(schedule, categoriesMap) {
  const li = document.createElement('li');

  li.dataset.id = schedule.id;
  li.id = schedule.id; // Para navegação direta
  li.className = 'schedule-item';
  li.classList.toggle('completed', schedule.completed);

  const category = categoriesMap.get(schedule.category);
  const priorityDot = category?.priority
    ? `<span class="priority-dot ${category.priority}" title="Priority: ${category.priority}"></span>`
    : '';

  li.innerHTML = `
    <div class="task-header">
      <div class="status-schedule"></div>

      <input class="input-checkbox" type="checkbox" ${
        schedule.completed ? 'checked' : ''
      }>

      <span class="name-task">
        ${priorityDot}${schedule.title}
      </span>

      <span class="date-task">
        ${schedule.date} at ${schedule.time}
      </span>
    </div>

    <div class="description">
      <span>${schedule.description}</span>
      <p class="task-category">
        Category: ${schedule.category || 'Uncategorized'}
      </p>
    </div>

    <div class="controls">
      <button class="edit-button">Edit</button>
      <button class="delete-button">Delete</button>
    </div>
  `;

  attachScheduleEvents(li, schedule);
  return li;
}

/* ======================================================
   ITEM EVENTS
====================================================== */

function attachScheduleEvents(li, schedule) {
  // Expand / collapse
  li.addEventListener('click', e => {
    if (e.target.type === 'checkbox' || e.target.tagName === 'BUTTON') return;

    li.classList.toggle('focused');
    li.querySelector('.description')?.classList.toggle('expanded');
    li.querySelector('.controls')?.classList.toggle('expanded');
    li.querySelector('.status-schedule')?.classList.toggle('active');
  });

  // Completion toggle
  li.querySelector('.input-checkbox').addEventListener('change', e => {
    e.stopPropagation();

    dbService.updateSchedule(schedule.id, {
      completed: e.target.checked
    });
  });

  // Edit
  li.querySelector('.edit-button').addEventListener('click', e => {
    e.stopPropagation();

    showEditScheduleModal(schedule, (updatedSchedule) => {
        dbService.updateSchedule(schedule.id, updatedSchedule);
        showToast('Schedule updated successfully', 'success');
    });
  });

  // Delete
  li.querySelector('.delete-button').addEventListener('click', e => {
    e.stopPropagation();

    showConfirmModal({
      title: 'Delete Schedule',
      message:
        'Are you sure you want to delete this schedule? This action cannot be undone.',
      confirmText: 'Delete',
      onConfirm: () => {
        dbService.deleteSchedule(schedule.id);
        showToast('Schedule deleted successfully', 'success');
      }
    });
  });
}

/* ======================================================
   UI HELPERS
====================================================== */

function updateEmptyState(schedules) {
  const currentSchedules = schedules || store.getSchedules();
  if (!noSchedulesMessage) return;
  noSchedulesMessage.classList.toggle(
    'active',
    currentSchedules.length === 0
  );
}

/* ======================================================
   DATA HELPERS
====================================================== */

function loadScheduleCategories() {
  const stored =
    JSON.parse(localStorage.getItem('scheduleCategories')) || [];

  return new Map(stored.map(c => [c.value, c]));
}
