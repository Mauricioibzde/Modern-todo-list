import "./modules/customSelectFormNewTask.js"
import "./modules/menuSideBar.js"
// import "./modules/taskList.js" // Logic moved to form.js for dynamic handling
import "./modules/form.js"
import { initNavigation } from "./modules/navigation.js"
import { Calendar } from "./modules/calendar.js"
import { CustomTimePicker } from "./modules/customTimePicker.js"
import "./modules/scheduleForm.js"

initNavigation();

// Initialize the custom calendar
document.addEventListener('DOMContentLoaded', () => {
    // Form Date Picker (Tasks)
    new Calendar('#date-picker-trigger', '#due-date');

    // Form Date Picker (Schedules)
    new Calendar('#date-picker-trigger-schedule', '#schedule-date');

    // Form Time Picker (Schedules)
    new CustomTimePicker('#time-picker-trigger-schedule', '#schedule-time');
    
    // Full Page Calendar
    new Calendar({ containerSelector: '#full-page-calendar-container' });
});
