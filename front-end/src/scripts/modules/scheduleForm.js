import { showToast } from './notifications.js';

const form = document.querySelector('.add-schedule');
const titleInput = document.querySelector('#schedule-title');
const descriptionInput = document.querySelector('#schedule-description');
const dateInput = document.querySelector('#schedule-date');
const timeInput = document.querySelector('#schedule-time');

let schedules = JSON.parse(localStorage.getItem('schedules')) || [];

if (form) {
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // --- Validation Start ---
        const categoryInput = document.querySelector('#schedule-category');
        const titleValue = titleInput.value.trim();
        const descriptionValue = descriptionInput.value.trim();
        const dateValue = dateInput.value;
        const timeValue = timeInput.value;
        const categoryValue = categoryInput.value;

        const errors = [];

        if (!titleValue) {
            errors.push("Title is required.");
        } else if (titleValue.length < 3) {
            errors.push("Title must be at least 3 characters long.");
        }

        if (!dateValue) {
            errors.push("Date is required.");
        }

        if (!timeValue) {
            errors.push("Time is required.");
        }

        if (errors.length > 0) {
            showToast("Please fix the following errors:\n- " + errors.join("\n- "), 'error');
            return; // Stop submission
        }
        // --- Validation End ---

        const newSchedule = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            title: titleValue,
            description: descriptionValue,
            date: dateValue,
            time: timeValue,
            category: categoryValue || 'Uncategorized',
            completed: false
        };

        schedules.push(newSchedule); 
        saveSchedules();
        console.log('Schedule Added:', newSchedule);

        showToast("Schedule Created Successfully!", 'success');
        
        form.reset();
        
        // Reset the date picker trigger text if needed
        const dateTriggerText = document.querySelector('#date-picker-trigger-schedule .text');
        if (dateTriggerText) {
            dateTriggerText.textContent = 'Select a date';
        }

        // Reset the time picker trigger text
        const timeTriggerText = document.querySelector('#time-picker-trigger-schedule .text');
        const timeTrigger = document.querySelector('#time-picker-trigger-schedule');
        
        if (timeTriggerText) {
            timeTriggerText.textContent = '00:00';
        }
        if (timeTrigger) {
             timeTrigger.classList.remove('has-value');
        }

        // Reset Category
        if (categoryInput) {
            categoryInput.value = '';
            const selectedText = categoryInput.parentNode.querySelector('.select-selected');
            if (selectedText) selectedText.textContent = 'Select Category';
            const selectedItems = categoryInput.parentNode.querySelectorAll('.same-as-selected');
            selectedItems.forEach(el => el.classList.remove('same-as-selected'));
        }
    });
}

function saveSchedules() {
    localStorage.setItem('schedules', JSON.stringify(schedules));
    document.dispatchEvent(new CustomEvent('schedulesUpdated'));
}

