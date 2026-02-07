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
   INIT
====================================================== */

export function initScheduleList() {
  store.addEventListener('schedulesUpdated', (e) => {
    const schedules = e.detail;
    renderSchedules(schedules);
    updateEmptyState(schedules);
  });
}

/* ======================================================
   RENDERING — LIST
====================================================== */

function renderSchedules(schedules) {
  if (!scheduleListUl) return;
  // Fallback to store if not passed
  const currentSchedules = schedules || store.getSchedules();

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
