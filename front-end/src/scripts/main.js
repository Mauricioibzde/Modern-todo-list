import "./modules/customSelectFormNewTask.js"
import "./modules/menuSideBar.js"
// import "./modules/taskList.js" // Logic moved to form.js for dynamic handling
import "./modules/form.js"
import { initNavigation } from "./modules/navigation.js"
import { Calendar } from "./modules/calendar.js"

initNavigation();

// Initialize the custom calendar
document.addEventListener('DOMContentLoaded', () => {
    new Calendar('#date-picker-trigger', '#due-date');
});
