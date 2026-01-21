
const form = document.querySelector('.add-schedule');
const titleInput = document.querySelector('#schedule-title');
const descriptionInput = document.querySelector('#schedule-description');
const dateInput = document.querySelector('#schedule-date');
const timeInput = document.querySelector('#schedule-time');

let schedules = JSON.parse(localStorage.getItem('schedules')) || [];

if (form) {
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const newSchedule = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            title: titleInput.value,
            description: descriptionInput.value,
            date: dateInput.value,
            time: timeInput.value,
            completed: false
        };

        schedules.push(newSchedule); 
        saveSchedules();
        console.log('Schedule Added:', newSchedule);

        alert("Schedule Created Successfully!");
        
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
            timeTriggerText.textContent = '--:--';
        }
        if (timeTrigger) {
             timeTrigger.classList.remove('has-value');
        }
    });
}

function saveSchedules() {
    localStorage.setItem('schedules', JSON.stringify(schedules));
    document.dispatchEvent(new CustomEvent('schedulesUpdated'));
}
