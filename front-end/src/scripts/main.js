import "./modules/customSelectFormNewTask.js"
import "./modules/menuSideBar.js"
import "./modules/form.js"
import { initNavigation } from "./modules/navigation.js"
import { Calendar } from "./modules/calendar.js"
import { CustomTimePicker } from "./modules/customTimePicker.js"
import "./modules/scheduleForm.js"
import { initScheduleList } from "./modules/scheduleList.js"
import { initTheme } from "./modules/theme.js"
import { initReminders } from "./modules/reminderService.js"



initNavigation();
initScheduleList();
initReminders();

// Initialize the custom calendar
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Form Date Picker (Tasks)
    new Calendar('#date-picker-trigger', '#due-date');

    // Form Date Picker (Schedules)
    new Calendar('#date-picker-trigger-schedule', '#schedule-date');

    // Form Time Picker (Schedules)
    new CustomTimePicker('#time-picker-trigger-schedule', '#schedule-time');
    
    // Full Page Calendar
    new Calendar({ containerSelector: '#full-page-calendar-container' });

    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registred', reg))
            .catch(err => console.log('SW failed', err));
    }
});
