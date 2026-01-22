export function showConfirmModal({ title, message, confirmText = 'Delete', cancelText = 'Cancel', onConfirm }) {
    // Check for existing modal
    let modalOverlay = document.querySelector('.modal-overlay-generic');
    
    // Always remove existing to ensure fresh state
    if (modalOverlay) {
        modalOverlay.remove();
    }

    // Create modal structure
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay modal-overlay-generic';
    
    modalOverlay.innerHTML = `
        <div class="modal-content">
            <h3 class="modal-title">${title}</h3>
            <p class="modal-message" style="margin-bottom: 1.5rem; color: var(--text-secondary); line-height: 1.5;">${message}</p>
            <div class="modal-actions">
                <button class="modal-btn modal-btn-cancel">${cancelText}</button>
                <button class="modal-btn modal-btn-delete">${confirmText}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    const cancelBtn = modalOverlay.querySelector('.modal-btn-cancel');
    const deleteBtn = modalOverlay.querySelector('.modal-btn-delete');

    // Show modal
    requestAnimationFrame(() => {
        modalOverlay.classList.add('active');
        // Focus the cancel button for accessibility/safety
        cancelBtn.focus();
    });

    const close = () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            if(modalOverlay.parentNode) modalOverlay.parentNode.removeChild(modalOverlay);
        }, 300);
    };

    cancelBtn.onclick = close;

    deleteBtn.onclick = () => {
        if (onConfirm) onConfirm();
        close();
    };

    // Keyboard support
    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            close();
            document.removeEventListener('keydown', handleKeydown);
        }
    };
    document.addEventListener('keydown', handleKeydown);

    // Click outside
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            close();
            document.removeEventListener('keydown', handleKeydown);
        }
    };
}
