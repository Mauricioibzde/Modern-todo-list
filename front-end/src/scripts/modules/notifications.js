// Icons
const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 15.75h.008v.008H12v-.008Z" /></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" /></svg>`
};

const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning'
};

function ensureContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Show a toast notification
 * @param {string} message - The body text
 * @param {'success'|'error'|'warning'} type - The type of notification
 * @param {string} [customTitle] - Optional title override
 */
export function showToast(message, type = 'success', customTitle) {
    const container = ensureContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconHtml = icons[type] || icons.success;
    const titleText = customTitle || titles[type] || 'Notification';
    const duration = 5000; // 5 seconds

    toast.innerHTML = `
        <div class="toast-icon">${iconHtml}</div>
        <div class="toast-content">
            <h4 class="toast-title">${titleText}</h4>
            <p class="toast-message">${message.replace(/\n/g, '<br>')}</p>
        </div>
        <button class="toast-close">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
        <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;

    // Remove on click close
    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast);
    });

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto remove
    const timer = setTimeout(() => {
        removeToast(toast);
    }, duration);

    // Pause on hover (optional enhancement - not implementing fully for simplicity, but stopping removing would be nice)
}

function removeToast(toast) {
    if (!toast) return;
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
    });
}
