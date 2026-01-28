/* =========================================================
   TOAST CONFIGURATION
   Centraliza todas as configurações globais
========================================================= */

const TOAST_CONFIG = {
  maxToasts: 3,              // Máximo de toasts simultâneos
  duration: 3000,            // Duração visível (ms)
  animationBuffer: 400       // Fallback de remoção (ms)
};

/* =========================================================
   TOAST TYPES
   Cada tipo define ícone e título padrão
========================================================= */

const TOAST_TYPES = {
  success: {
    title: 'Success',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
    </svg>`
  },
  error: {
    title: 'Error',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75h.008v.008H12v-.008Z"/>
    </svg>`
  },
  warning: {
    title: 'Warning',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z"/>
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75h.008v.008H12v-.008Z"/>
    </svg>`
  },
  info: {
    title: 'Info',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021"/>
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0Z"/>
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25h.008v.008H12V8.25Z"/>
    </svg>`
  }
};

/* =========================================================
   CONTAINER
   Garante que o container exista apenas uma vez
========================================================= */

function ensureContainer() {
  let container = document.getElementById('toast-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  return container;
}

/* =========================================================
   TOAST CREATION
   Responsável APENAS por criar o HTML
========================================================= */

function createToastElement({ message, type, title }) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  // Usado para evitar duplicados de forma segura
  toast.dataset.message = message;

  toast.innerHTML = `
    <div class="toast-icon">${TOAST_TYPES[type].icon}</div>
    <div class="toast-content">
      <h4 class="toast-title">${title}</h4>
      <p class="toast-message">${message.replace(/\n/g, '<br>')}</p>
    </div>
    <button class="toast-close" aria-label="Close notification">✕</button>
    <div class="toast-progress"></div>
  `;

  return toast;
}

/* =========================================================
   TOAST LIFECYCLE
   Controla animação, tempo de vida e eventos
========================================================= */

function setupToastLifecycle(toast) {
  const progressBar = toast.querySelector('.toast-progress');
  const closeButton = toast.querySelector('.toast-close');

  // Reinicia animação da progress bar
  progressBar.style.animation = 'none';
  void progressBar.offsetWidth;
  progressBar.style.animation = `toast-progress linear ${TOAST_CONFIG.duration}ms forwards`;

  // Timer automático
  const timer = setTimeout(() => removeToast(toast), TOAST_CONFIG.duration);

  // Fechamento manual
  closeButton.addEventListener('click', () => {
    clearTimeout(timer);
    removeToast(toast);
  });

  // Trigger da animação de entrada
  requestAnimationFrame(() => toast.classList.add('show'));
}

/* =========================================================
   PUBLIC API — SHOW TOAST
========================================================= */

/**
 * Exibe um toast
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {string} [customTitle]
 */
export function showToast(message, type = 'success', customTitle) {
  const container = ensureContainer();
  const toastType = TOAST_TYPES[type] ? type : 'success';
  const title = customTitle || TOAST_TYPES[toastType].title;

  // Remove toasts duplicados (mesma mensagem)
  [...container.children].forEach(existingToast => {
    if (existingToast.dataset.message === message) {
      removeToast(existingToast);
    }
  });

  // Limita quantidade máxima
  if (container.childElementCount >= TOAST_CONFIG.maxToasts) {
    removeToast(container.firstElementChild);
  }

  const toast = createToastElement({ message, type: toastType, title });
  container.appendChild(toast);
  setupToastLifecycle(toast);
}

/* =========================================================
   TOAST REMOVAL
========================================================= */

function removeToast(toast) {
  if (!toast || !toast.parentNode) return;

  toast.classList.remove('show');

  const cleanup = () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  };

  // Remove após transição
  toast.addEventListener('transitionend', cleanup, { once: true });

  // Fallback de segurança
  setTimeout(cleanup, TOAST_CONFIG.animationBuffer);
}

/* =========================================================
   BADGE
========================================================= */

export function updateBadge(count) {
  const badge = document.querySelector('.notification-badge');
  if (!badge) return;

  badge.textContent = count > 99 ? '99+' : count;
  badge.classList.toggle('hidden', count <= 0);
}

/* =========================================================
   NOTIFICATION MODAL
========================================================= */

export function showNotificationModal(items) {
  if (!items || items.length === 0) {
    showToast('No upcoming deadlines in the next 3 days.', 'info');
    return;
  }

  const existingModal = document.getElementById('notification-list-modal');
  if (existingModal) existingModal.remove();

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'notification-list-modal';
  modalOverlay.className = 'modal-overlay active';

  // Ordenação segura por data
  const sortedItems = [...items].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  modalOverlay.innerHTML = `
    <div class="modal-content">
      <h3 class="modal-title">Upcoming Deadlines</h3>
      <ul class="notification-list">
        ${sortedItems.map(renderNotificationItem).join('')}
      </ul>
      <div class="modal-actions">
        <button class="modal-btn modal-btn-confirm">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const close = () => {
    modalOverlay.classList.remove('active');
    setTimeout(() => modalOverlay.remove(), 300);
  };

    modalOverlay.querySelector('.modal-btn-confirm').onclick = close;
    modalOverlay.onclick = e => e.target === modalOverlay && close();

    // Delegação de evento para navegação ao clicar no item
    modalOverlay.querySelector('.notification-list').onclick = function(e) {
      let li = e.target.closest('.notification-item-link');
      if (li && li.dataset.refId) {
        const refId = li.dataset.refId;
        // Descobre o tipo do item (task ou schedule) a partir do elemento
        const type = li.querySelector('.notification-item-tag')?.textContent?.trim();
        // Navega para a lista correta
        if (type === 'task') {
          document.getElementById('nav-all-tasks')?.click();
        } else if (type === 'schedule') {
          document.getElementById('nav-all-schedules')?.click();
        }
        // Aguarda a lista renderizar e rola até o item
        setTimeout(() => {
          const el = document.getElementById(refId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-notification');
            setTimeout(() => el.classList.remove('highlight-notification'), 2300);
            close();
          }
        }, 350);
      }
    };
}

/* =========================================================
   HELPERS
========================================================= */

function renderNotificationItem(item) {
  // Tenta extrair categoria do objeto original (task ou schedule)
  let category = '';
  let id = '';
  if (item.original && item.original.category) {
    category = item.original.category;
  }
  if (item.original && item.original.id) {
    id = item.original.id;
  }
  // Ícone por tipo
  const icon = item.type === 'task'
    ? ''
    : '<svg style="width:18px;height:18px;color:var(--color-primary);vertical-align:middle;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>';
  return `
    <li class="notification-item notification-item-link" data-ref-id="${id}" tabindex="0">
      <div class="notification-item-header">
        <span class="notification-item-title">${icon} ${escapeHtml(item.title)}</span>
        <span class="notification-item-tag ${item.type}">${item.type}</span>
      </div>
      ${category ? `<div class="notification-item-category"><strong>Categoria:</strong> ${escapeHtml(category)}</div>` : ''}
      ${item.description ? `<div class="notification-item-info">${escapeHtml(item.description)}</div>` : ''}
      <div class="notification-item-due">Due: ${item.date}</div>
    </li>
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
