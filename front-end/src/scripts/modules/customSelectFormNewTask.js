import { showToast } from './notifications.js';

const defaultCategories = [];

function initCustomSelects() {
    const customCategoryDivs = document.querySelectorAll('.custom-category');
    customCategoryDivs.forEach(container => {
        setupCustomSelect(container);
    });
}

function setupCustomSelect(customCategoryDiv) {
    // Determine Input ID based on data attribute or fallback
    const inputId = customCategoryDiv.dataset.inputId || 'category';
    const storageKey = customCategoryDiv.dataset.storageKey || 'customCategories'; // Default for backward compatibility
    
    // Check if already initialized to prevent double init
    if (customCategoryDiv.querySelector('.select-selected')) return;

    // Create hidden input to hold the value
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'category';
    hiddenInput.id = inputId;
    customCategoryDiv.appendChild(hiddenInput);

    // Create the selected display element
    const selectedDiv = document.createElement('div');
    selectedDiv.className = 'select-selected';
    selectedDiv.textContent = 'Select Category';
    customCategoryDiv.appendChild(selectedDiv);

    // Create the options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'select-items select-hide';
    
    // Helper function to create option element
    function createOption(label, value, isCustom = false, priority = null) {
        const optionElement = document.createElement('div');
        optionElement.className = 'select-item';
        optionElement.dataset.value = value;
        
        // Priority Dot
        if (priority) {
            const dot = document.createElement('span');
            dot.className = `priority-dot ${priority}`;
            optionElement.appendChild(dot);
        }
        
        // Text Span
        const textSpan = document.createElement('span');
        textSpan.textContent = label;
        optionElement.appendChild(textSpan);

        // Delete Button (only for custom)
        if (isCustom) {
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'delete-category-btn';
            deleteBtn.title = "Delete category";
            deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>`;
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Remove from Storage
                const currentCustom = JSON.parse(localStorage.getItem(storageKey)) || [];
                const updatedCustom = currentCustom.filter(c => c.value !== value);
                localStorage.setItem(storageKey, JSON.stringify(updatedCustom));
                
                // Dispatch event to update all instances
                document.dispatchEvent(new CustomEvent(storageKey + 'Updated'));

                showToast(`Category "${label}" deleted`, 'success');
            });
            
            optionElement.appendChild(deleteBtn);
        }

        // Selection Logic
        optionElement.addEventListener('click', function(e) {
            e.stopPropagation(); // Important!

            // Update hidden input
            hiddenInput.value = this.dataset.value;
            // Update displayed text
            selectedDiv.innerHTML = ''; 
            if (priority) {
                 const dot = document.createElement('span');
                 dot.className = `priority-dot ${priority}`;
                 selectedDiv.appendChild(dot);
            }
            selectedDiv.appendChild(document.createTextNode(textSpan.textContent));
            
            // Remove 'same-as-selected' class from all
            const sameAsSelected = optionsContainer.getElementsByClassName('same-as-selected');
            for (let k = 0; k < sameAsSelected.length; k++) {
                sameAsSelected[k].classList.remove('same-as-selected');
            }
            // Add class to this
            this.classList.add('same-as-selected');
            
            // Close the dropdown
            selectedDiv.click();
        });
        return optionElement;
    }

    function renderOptions() {
        optionsContainer.innerHTML = '';
        const storedCategories = JSON.parse(localStorage.getItem(storageKey)) || [];

        // Render default categories
        defaultCategories.forEach(optionData => {
            optionsContainer.appendChild(createOption(optionData.label, optionData.value, false));
        });

        // Render custom categories
        storedCategories.forEach(optionData => {
            optionsContainer.appendChild(createOption(optionData.label, optionData.value, true, optionData.priority));
        });

        // Create "Add New Category" option
        const addOptionElement = document.createElement('div');
        addOptionElement.className = 'select-item add-new-category';
        addOptionElement.style.borderTop = '1px solid var(--border-dim)';
        addOptionElement.style.color = 'var(--color-primary)';
        addOptionElement.innerHTML = '+ Create New Category';
        
        addOptionElement.addEventListener('click', function(e) {
            e.stopPropagation();

            showCategoryModal((newCategoryName, priority) => {
                if (newCategoryName && newCategoryName.trim() !== "") {
                    const formattedName = newCategoryName.trim();
                    const lowerName = formattedName.toLowerCase();

                    // Check if already exists
                    const exists = [...defaultCategories, ...JSON.parse(localStorage.getItem(storageKey) || '[]')]
                                    .some(c => c.value === lowerName);
                    
                    if (exists) {
                        showToast("Category already exists!", 'warning');
                        return;
                    }

                    const newCategory = { value: lowerName, label: formattedName, priority: priority };
                    
                    // Save to LocalStorage
                    const currentCustom = JSON.parse(localStorage.getItem(storageKey)) || [];
                    currentCustom.push(newCategory);
                    localStorage.setItem(storageKey, JSON.stringify(currentCustom));

                    // Dispatch event
                    document.dispatchEvent(new CustomEvent(storageKey + 'Updated'));
                    
                    // Force selection after update
                    setTimeout(() => {
                         const newOption = optionsContainer.querySelector(`[data-value="${lowerName}"]`);
                         if (newOption) newOption.click();
                    }, 50);
                }
            });
        });

        optionsContainer.appendChild(addOptionElement);
    }

    // Initial Render
    renderOptions();
    
    // Listen for global updates specific to this key
    document.addEventListener(storageKey + 'Updated', () => {
        // Remember selection?
        const currentVal = hiddenInput.value;
        renderOptions();
        // Restore selection if it still exists
        if (currentVal) {
            const optionToReselect = optionsContainer.querySelector(`[data-value="${currentVal}"]`);
            if (optionToReselect) {
                 optionToReselect.classList.add('same-as-selected');
            } else {
                 selectedDiv.textContent = 'Select Category';
                 hiddenInput.value = '';
            }
        }
    });
    
    customCategoryDiv.appendChild(optionsContainer);

    // Event listener to toggle dropdown
    selectedDiv.addEventListener('click', function(e) {
        e.stopPropagation();
        closeAllSelect(this);
        this.nextElementSibling.classList.toggle('select-hide');
        this.classList.toggle('select-arrow-active');
    });
}


function showCategoryModal(onConfirm) {
    // Check if modal already exists
    let modalOverlay = document.querySelector('.modal-overlay');
    
    if (!modalOverlay) {
        // Create modal structure
        modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        modalOverlay.innerHTML = `
            <div class="modal-content">
                <h3 class="modal-title">Create New Category</h3>
                <input type="text" class="modal-input" placeholder="e.g., Fitness, Travel, Study..." autofocus>
                
                <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">Select Priority</h4>
                <div class="modal-priority-selector">
                    <div class="priority-option" data-priority="low">Low</div>
                    <div class="priority-option" data-priority="medium">Medium</div>
                    <div class="priority-option" data-priority="high">High</div>
                    <div class="priority-option" data-priority="extreme">Extreme</div>
                </div>

                <div class="modal-actions">
                    <button class="modal-btn modal-btn-cancel">Cancel</button>
                    <button class="modal-btn modal-btn-confirm">Create</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
    }

    const input = modalOverlay.querySelector('.modal-input');
    const cancelBtn = modalOverlay.querySelector('.modal-btn-cancel');
    const confirmBtn = modalOverlay.querySelector('.modal-btn-confirm');
    const priorityOptions = modalOverlay.querySelectorAll('.priority-option');

    // Reset state
    input.value = '';
    // Select default 'low'
    priorityOptions.forEach(opt => opt.classList.remove('selected'));
    modalOverlay.querySelector('[data-priority="low"]').classList.add('selected');
    let selectedPriority = 'low';

    // Priority Selection Logic
    priorityOptions.forEach(opt => {
        // Clone node to clear old listeners if any (simple reset)
        // OR just handle clicks cleanly. Let's handle clicks.
        // Since we reuse the modal, we need to be careful not to stack listeners.
        // A simple way is to re-assign onclick.
        opt.onclick = function() {
            priorityOptions.forEach(p => p.classList.remove('selected'));
            this.classList.add('selected');
            selectedPriority = this.dataset.priority;
        };
    });

    // Show modal
    requestAnimationFrame(() => {
        modalOverlay.classList.add('active');
        input.focus();
    });

    const close = () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            if(modalOverlay.parentNode) modalOverlay.parentNode.removeChild(modalOverlay);
        }, 300);
    };
    
    cancelBtn.onclick = close;

    confirmBtn.onclick = () => {
        const val = input.value;
        onConfirm(val, selectedPriority);
        close();
    };
    
    // Allow Enter key
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            confirmBtn.click();
        } else if (e.key === 'Escape') {
            close();
        }
    };
    
    // Click outside to close
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) close();
    };
}

function closeAllSelect(elmnt) {
    const items = document.getElementsByClassName("select-items");
    const selected = document.getElementsByClassName("select-selected");
    const arrNo = [];
    
    for (let i = 0; i < selected.length; i++) {
        if (elmnt == selected[i]) {
            arrNo.push(i)
        } else {
            selected[i].classList.remove("select-arrow-active");
        }
    }
    
    for (let i = 0; i < items.length; i++) {
        if (arrNo.indexOf(i)) {
            items[i].classList.add("select-hide");
        }
    }
}

initCustomSelects()
