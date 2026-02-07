import { Calendar } from './calendar.js';
import { CustomTimePicker } from './customTimePicker.js';
import { initCustomSelects } from './customSelectFormNewTask.js';

/* ======================================================
   GENERIC MODAL HELPERS
====================================================== */

function removeExistingModal(selector) {
  const existing = document.querySelector(selector);
  if (existing) existing.remove();
}

function createModalOverlay(className) {
  const overlay = document.createElement('div');
  overlay.className = `modal-overlay ${className}`;
  document.body.appendChild(overlay);
  return overlay;
}

function openModal(overlay, focusEl) {
  requestAnimationFrame(() => {
    overlay.classList.add('active');
    focusEl?.focus();
  });
}

function closeModal(overlay) {
  overlay.classList.remove('active');
  setTimeout(() => {
    if (overlay.parentNode) overlay.remove();
  }, 300);
}

/* ======================================================
   CONFIRM MODAL
====================================================== */

export function showConfirmModal({
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm
}) {
  removeExistingModal('.modal-overlay-generic');

  const overlay = createModalOverlay('modal-overlay-generic');

  overlay.innerHTML = `
    <div class="modal-content">
      <h3 class="modal-title">${title}</h3>
      <p class="modal-message">${message}</p>

      <div class="modal-actions">
        <button class="modal-btn modal-btn-cancel">${cancelText}</button>
        <button class="modal-btn modal-btn-delete">${confirmText}</button>
      </div>
    </div>
  `;

  const cancelBtn = overlay.querySelector('.modal-btn-cancel');
  const confirmBtn = overlay.querySelector('.modal-btn-delete');

  const close = () => closeModal(overlay);

  cancelBtn.onclick = close;
  confirmBtn.onclick = () => {
    onConfirm?.();
    close();
  };

  // Keyboard support
  const onKeydown = e => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onKeydown);
    }
  };
  document.addEventListener('keydown', onKeydown);

  // Click outside
  overlay.onclick = e => {
    if (e.target === overlay) close();
  };

  openModal(overlay, cancelBtn);
}

/* ======================================================
   DAY DETAILS MODAL
====================================================== */

export function showDayDetailsModal(dateStr, items , categoryFilter) {
  removeExistingModal('.modal-overlay-details');

  const overlay = createModalOverlay('modal-overlay-details');

  overlay.innerHTML = `
    <div class="modal-content">
      <h3 class="modal-title">Events for ${dateStr}</h3>
      ${renderItems(items)}
      <div class="modal-actions">
        <button class="modal-btn modal-btn-cancel">Close</button>
      </div>
    </div>
  `;

  const closeBtn = overlay.querySelector('.modal-btn-cancel');
  const close = () => closeModal(overlay);

  closeBtn.onclick = close;
  overlay.onclick = e => {
    if (e.target === overlay) close();
  };

  attachItemNavigation(overlay, close);
  openModal(overlay, closeBtn);
}

/* ======================================================
   ITEMS RENDERING
====================================================== */

function renderItems(items) {
  if (!items.length) {
    return `
      <p class="empty-state">
        No tasks or schedules for this day.
      </p>
    `;
  }

  return `
    <ul class="modal-items-list">
      ${items.map(renderItemRow).join('')}
    </ul>
  `;
}

function renderItemRow(item) {
  const isTask = item.type === 'task';

  return `
    <li class="modal-item-row"
        data-id="${item.id}"
        data-type="${item.type}">
    

      <div class="item-info">
        <div class="item-title">${item.title}</div>
        <div class="item-meta">
          ${isTask ? 'Task' : `Schedule: ${item.time}`}
          • ${item.category || 'Uncategorized'}
        </div>
      </div>

      <div class="hover-icon">➜</div>
    </li>
  `;
}


/* ======================================================
   ITEM NAVIGATION
====================================================== */

function attachItemNavigation(overlay, close) {
  overlay.querySelectorAll('.modal-item-row').forEach(row => {
    row.onclick = () => {
      const { id, type } = row.dataset;
      close();
      navigateToItem(id, type);
    };

    row.onmouseenter = () => {
      row.style.backgroundColor = 'var(--bg-hover)';
    };
    row.onmouseleave = () => {
      row.style.backgroundColor = 'var(--bg-tertiary)';
    };
  });
}

function navigateToItem(id, type) {
  const navId =
    type === 'task' ? 'nav-all-tasks' : 'nav-all-schedules';

  document.getElementById(navId)?.click();

  setTimeout(() => {
    const listSelector =
      type === 'task' ? '.list-tasks-ul' : '.list-schedules-ul';

    const container = document.querySelector(listSelector);
    const itemEl = container?.querySelector(`li[data-id="${id}"]`);

    if (!itemEl) return;

    itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (!itemEl.classList.contains('focused')) {
      itemEl.click();
    }

    flashItem(itemEl);
  }, 300);
}

function flashItem(el) {
  const original = el.style.boxShadow;
  el.style.boxShadow = '0 0 0 4px var(--focus-overlay-primary)';

  setTimeout(() => {
    el.style.boxShadow = original;
  }, 1000);
}

/* ======================================================
   EDIT MODALS
====================================================== */

export function showEditTaskModal(task, onSave) {
  removeExistingModal('.modal-overlay-edit');
  const overlay = createModalOverlay('modal-overlay-edit');

  overlay.innerHTML = `
    <div class="modal-content create-task" style="max-height: 90vh; overflow-y: auto;">
      <h3 class="modal-title">Edit Task</h3>
      
      <div class="add-task" style="grid-template-columns: 1fr;">
        <label for="edit-task-title">Title</label>
        <input type="text" id="edit-task-title" value="${task.title}" placeholder="Task title" />

        <label for="edit-task-desc">Description</label>
        <textarea id="edit-task-desc" placeholder="Task description">${task.description || ''}</textarea>

        <label for="edit-task-date">Due Date</label>
        <div class="custom-date-picker">
            <input type="hidden" id="edit-task-date-input" value="${task.dueDate || ''}" />
            <div class="date-trigger" id="edit-task-calendar-trigger">
                <span class="text">${task.dueDate || 'Select a date'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
            </div>
        </div>

        <div class="custom-category" 
             data-input-id="edit-task-category" 
             data-storage-key="customCategories">
        </div>
      </div>

      <div class="modal-actions" style="margin-top: 2rem; width: 100%; display: flex; gap: 10px; justify-content: flex-end;">
         <button class="modal-btn modal-btn-cancel">Cancel</button>
         <button class="modal-btn modal-btn-save" style="background-color: var(--color-primary); color: white;">Save Changes</button>
      </div>
    </div>
  `;

  // Init Date Picker
  new Calendar('#edit-task-calendar-trigger', '#edit-task-date-input');

  // Init Categories
  initCustomSelects();

  // Pre-fill Category
  setTimeout(() => {
     const hiddenInput = document.getElementById('edit-task-category');
     const catContainer = overlay.querySelector('.custom-category');
     
     if(hiddenInput && task.category) {
         hiddenInput.value = task.category;
         // Correct key class from customSelectFormNewTask.js
         const trigger = catContainer.querySelector('.select-selected');
         if(trigger) {
           trigger.textContent = task.category;
         }
     }
  }, 50);

  const saveBtn = overlay.querySelector('.modal-btn-save');
  const cancelBtn = overlay.querySelector('.modal-btn-cancel');

  const close = () => closeModal(overlay);

  cancelBtn.onclick = close;
  saveBtn.onclick = () => {
    const title = document.getElementById('edit-task-title').value;
    const description = document.getElementById('edit-task-desc').value;
    const dueDate = document.getElementById('edit-task-date-input').value; 
    const category = document.getElementById('edit-task-category').value;

    if (!title) {
        alert('Title is required'); 
        return;
    }

    onSave({
        ...task,
        title,
        description,
        dueDate,
        category
    });
    close();
  };

  openModal(overlay, document.getElementById('edit-task-title'));
}

export function showEditScheduleModal(schedule, onSave) {
  removeExistingModal('.modal-overlay-edit-schedule');
  const overlay = createModalOverlay('modal-overlay-edit-schedule');

  overlay.innerHTML = `
    <div class="modal-content create-schedule" style="max-height: 90vh; overflow-y: auto;">
      <h3 class="modal-title">Edit Schedule</h3>
      
      <div class="add-schedule" style="grid-template-columns: 1fr;">
        <label for="edit-schedule-title">Title</label>
        <input type="text" id="edit-schedule-title" value="${schedule.title}" placeholder="Schedule title" />

        <label for="edit-schedule-desc">Description</label>
        <textarea id="edit-schedule-desc" placeholder="Schedule description">${schedule.description || ''}</textarea>

        <label for="edit-schedule-date">Date</label>
        <div class="custom-date-picker">
            <input type="hidden" id="edit-schedule-date-input" value="${schedule.date || ''}" />
            <div class="date-trigger" id="edit-schedule-calendar-trigger">
                <span class="text">${schedule.date || 'Select a date'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
                   <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
            </div>
        </div>

        <label for="edit-schedule-time">Time</label>
        <div class="custom-time-picker">
             <input type="hidden" id="edit-schedule-time-input" value="${schedule.time || ''}" />
             <div class="time-trigger" id="edit-schedule-time-trigger">
                  <span class="text">${schedule.time || '00:00'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
             </div>
        </div>

      <div class="custom-category" 
           data-input-id="edit-schedule-category" 
           data-storage-key="customCategories">
      </div>
      </div>

      <div class="modal-actions" style="margin-top: 2rem; width: 100%; display: flex; gap: 10px; justify-content: flex-end;">
         <button class="modal-btn modal-btn-cancel">Cancel</button>
         <button class="modal-btn modal-btn-save" style="background-color: var(--color-primary); color: white;">Save Changes</button>
      </div>
    </div>
  `;

  // Init Date Picker
  new Calendar('#edit-schedule-calendar-trigger', '#edit-schedule-date-input');
  
  // Init Time Picker (assuming CustomTimePicker takes trigger, input)
  new CustomTimePicker('#edit-schedule-time-trigger', '#edit-schedule-time-input');

  // Init Categories
  initCustomSelects();

  // Pre-fill Category
  setTimeout(() => {
     const hiddenInput = document.getElementById('edit-schedule-category');
     const catContainer = overlay.querySelector('.custom-category');
     
     if(hiddenInput && schedule.category) {
         hiddenInput.value = schedule.category;
         // Correct class
         const trigger = catContainer.querySelector('.select-selected');
         if(trigger) {
           trigger.textContent = schedule.category;
         }
     }
  }, 50);

  const saveBtn = overlay.querySelector('.modal-btn-save');
  const cancelBtn = overlay.querySelector('.modal-btn-cancel');

  const close = () => closeModal(overlay);

  cancelBtn.onclick = close;
  saveBtn.onclick = () => {
    const title = document.getElementById('edit-schedule-title').value;
    const description = document.getElementById('edit-schedule-desc').value;
    const date = document.getElementById('edit-schedule-date-input').value; 
    const time = document.getElementById('edit-schedule-time-input').value;
    const category = document.getElementById('edit-schedule-category').value;

    if (!title || !date) {
        alert('Title and Date are required'); 
        return;
    }

    onSave({
        ...schedule,
        title,
        description,
        date,
        time,
        category
    });
    close();
  };

  openModal(overlay, document.getElementById('edit-schedule-title'));
}

