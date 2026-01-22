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

export function showDayDetailsModal(dateStr, items) {
    let modalOverlay = document.querySelector('.modal-overlay-details');
    if (modalOverlay) modalOverlay.remove();

    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay modal-overlay-details';

    // Build items HTML
    let itemsHtml = '';
    if (items.length === 0) {
        itemsHtml = '<p style="text-align:center; color:var(--text-muted); padding: 1rem;">No tasks or schedules for this day.</p>';
    } else {
        itemsHtml = '<ul class="modal-items-list" style="list-style:none; max-height: 300px; overflow-y: auto; padding-right: 5px;">';
        items.forEach(item => {
            const isTask = item.type === 'task';
            const icon = isTask 
                ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`;
            
            itemsHtml += `
                <li class="modal-item-row" data-id="${item.id}" data-type="${isTask ? 'task' : 'schedule'}" style="display:flex; align-items:center; gap:10px; padding: 10px; background: var(--bg-tertiary); margin-bottom: 8px; border-radius: 8px; border: 1px solid var(--border-dim); cursor: pointer; transition: background-color 0.2s;">
                    <div style="color:var(--text-secondary); display:flex; align-items:center;">${icon}</div>
                    <div style="flex:1;">
                        <div style="font-weight:500; color:var(--text-primary); font-size: 0.95rem;">${item.title}</div>
                        <div style="font-size:0.8rem; color:var(--text-muted);">${isTask ? 'Task' : `Schedule: ${item.time}`} • ${item.category || 'Uncategorized'}</div>
                    </div>
                    <div class="hover-icon" style="opacity: 0.5;">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                    </div>
                </li>
            `;
        });
        itemsHtml += '</ul>';
    }

    modalOverlay.innerHTML = `
        <div class="modal-content">
            <h3 class="modal-title">Events for ${dateStr}</h3>
            ${itemsHtml}
            <div class="modal-actions" style="margin-top: 1.5rem;">
                <button class="modal-btn modal-btn-cancel" style="width:100%">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    // Add click listeners to rows
    const rows = modalOverlay.querySelectorAll('.modal-item-row');
    rows.forEach(row => {
        row.addEventListener('click', () => {
             const id = row.dataset.id;
             const type = row.dataset.type;
             
             close(); // Close modal first

             // Navigate and Focus
             const navId = type === 'task' ? 'nav-all-tasks' : 'nav-all-schedules';
             const navElement = document.getElementById(navId);
             
             if (navElement) {
                 navElement.click(); 

                 // Wait for rendering
                 setTimeout(() => {
                     const containerSelector = type === 'task' ? '.list-tasks-ul' : '.list-schedules-ul';
                     const container = document.querySelector(containerSelector);
                     if (container) {
                         // Find item by Data ID
                         const itemEl = container.querySelector(`li[data-id="${id}"]`);
                         if (itemEl) {
                             itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                             // Trigger click to expand if not expanded
                             if (!itemEl.classList.contains('focused')) {
                                 itemEl.click();
                             }
                             // Flash effect
                             itemEl.style.transition = 'box-shadow 0.3s';
                             const originalShadow = itemEl.style.boxShadow;
                             itemEl.style.boxShadow = '0 0 0 4px var(--focus-overlay-primary)';
                             setTimeout(() => {
                                 itemEl.style.boxShadow = originalShadow;
                             }, 1000);
                         }
                     }
                 }, 300); // 300ms delay to allow view switch and render
             }
        });
        
        // Hover effect for row
        row.addEventListener('mouseenter', () => row.style.backgroundColor = 'var(--bg-hover)');
        row.addEventListener('mouseleave', () => row.style.backgroundColor = 'var(--bg-tertiary)');
    });

    const closeBtn = modalOverlay.querySelector('.modal-btn-cancel');

    requestAnimationFrame(() => {
        modalOverlay.classList.add('active');
        closeBtn.focus();
    });

    const close = () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            if(modalOverlay.parentNode) modalOverlay.parentNode.removeChild(modalOverlay);
        }, 300);
    };

    closeBtn.onclick = close;
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) close();
    };
}
