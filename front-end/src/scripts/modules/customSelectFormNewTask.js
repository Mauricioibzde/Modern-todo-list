const categorySelect = [
    { value: 'work', label: 'Work' },
    { value: 'personal', label: 'Personal' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'others', label: 'Others' },
]

function customSelectFormNewTask () {
    const customCategoryDiv = document.querySelector('.custom-category');
    
    // Create hidden input to hold the value
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'category';
    hiddenInput.id = 'category';
    customCategoryDiv.appendChild(hiddenInput);

    // Create the selected display element
    const selectedDiv = document.createElement('div');
    selectedDiv.className = 'select-selected';
    selectedDiv.textContent = 'Select Category';
    customCategoryDiv.appendChild(selectedDiv);

    // Create the options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'select-items select-hide';
    
    categorySelect.forEach(optionData => {
        const optionElement = document.createElement('div');
        optionElement.className = 'select-item';
        optionElement.textContent = optionData.label;
        optionElement.dataset.value = optionData.value;
        
        optionElement.addEventListener('click', function() {
            // Update hidden input
            hiddenInput.value = this.dataset.value;
            // Update displayed text
            selectedDiv.textContent = this.textContent;
            
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
        
        optionsContainer.appendChild(optionElement);
    });
    
    customCategoryDiv.appendChild(optionsContainer);

    // Event listener to toggle dropdown
    selectedDiv.addEventListener('click', function(e) {
        e.stopPropagation();
        closeAllSelect(this);
        this.nextElementSibling.classList.toggle('select-hide');
        this.classList.toggle('select-arrow-active');
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", closeAllSelect);
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

customSelectFormNewTask ()