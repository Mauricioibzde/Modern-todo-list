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
      <div class="item-icon">${getItemIcon(isTask)}</div>

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

function getItemIcon(isTask) {
  return isTask
    ? '📋'
    : '⏰';
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
