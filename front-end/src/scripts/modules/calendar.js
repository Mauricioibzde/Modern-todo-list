import dayjs from 'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/+esm';
import { showDayDetailsModal } from './modals.js';
import { dbService } from '../services/db.js';

export class Calendar {
    /**
     * @param {Object|String} optionsOrTrigger - Config object OR trigger selector string (legacy support)
     * @param {String} [inputSelector] - Input selector string (legacy support)
     */
    constructor(optionsOrTrigger, inputSelector) {
        this.currentDate = dayjs();
        this.selectedDate = null;
        this.tasks = [];
        this.schedules = [];

        // Subscribe to data
        dbService.onTasksSnapshot((data) => {
            this.tasks = data;
            this.renderCalendar();
        });
        dbService.onSchedulesSnapshot((data) => {
            this.schedules = data;
            this.renderCalendar();
        });

        if (typeof optionsOrTrigger === 'string') {
            // Legacy mode: (trigger, input)
            this.trigger = document.querySelector(optionsOrTrigger);
            this.hiddenInput = document.querySelector(inputSelector);
            this.isInline = false;
        } else {
            // Config object mode
            const { triggerSelector, inputSelector, containerSelector } = optionsOrTrigger;
            
            if (containerSelector) {
                this.container = document.querySelector(containerSelector);
                this.isInline = true;
            } else {
                this.trigger = document.querySelector(triggerSelector);
                this.hiddenInput = document.querySelector(inputSelector);
                this.isInline = false;
            }
        }

        // Validation
        if (this.isInline) {
            if (!this.container) return;
        } else {
            if (!this.trigger || !this.hiddenInput) return;
        }

        this.init();
    }

    init() {
        this.createCalendarStructure();
        this.attachEvents();
        this.renderCalendar();
    }

    createCalendarStructure() {
        // Create main wrapper
        const calendarWrapper = document.createElement('div');
        calendarWrapper.className = this.isInline ? 'calendar-inline' : 'calendar-dropdown';

        // Header
        this.header = document.createElement('div');
        this.header.className = 'calendar-header';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'calendar-nav-btn prev';
        prevBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>`;
        
        this.monthDisplay = document.createElement('h3');
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'calendar-nav-btn next';
        nextBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 16px; height: 16px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>`;

        this.header.appendChild(prevBtn);
        this.header.appendChild(this.monthDisplay);
        this.header.appendChild(nextBtn);

        // Grid
        this.grid = document.createElement('div');
        this.grid.className = 'calendar-grid';

        // Day names
        const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        dayNames.forEach(day => {
            const el = document.createElement('div');
            el.className = 'calendar-day-name';
            el.textContent = day;
            this.grid.appendChild(el);
        });

        calendarWrapper.appendChild(this.header);
        calendarWrapper.appendChild(this.grid);
        
        if (this.isInline) {
            // Append directly to container
            this.container.appendChild(calendarWrapper);
        } else {
            // Dropdown mode: Insert after trigger
            this.dropdown = calendarWrapper;
            this.trigger.parentNode.insertBefore(this.dropdown, this.trigger.nextSibling);
        }

        // Bind nav events
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            this.changeMonth(-1);
        });
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            e.stopPropagation();
            this.changeMonth(1);
        });
    }

    attachEvents() {
        if (!this.isInline) {
            this.trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCalendar();
            });

            document.addEventListener('click', (e) => {
                if (this.dropdown && !this.dropdown.contains(e.target) && !this.trigger.contains(e.target)) {
                    this.closeCalendar();
                }
            });
        }
    }

    toggleCalendar() {
        if (this.isInline) return;

        // Close ANY open time dropdowns first
        const timeDropdowns = document.querySelectorAll('.time-dropdown.show');
        timeDropdowns.forEach(d => {
            d.classList.remove('show');
            setTimeout(() => d.style.display = 'none', 300);
        });

        if (this.dropdown.classList.contains('show')) {
            this.closeCalendar();
        } else {
            // Ensure display is set if it was hidden by other scripts
            this.dropdown.style.display = 'block';
             // Force reflow to enable transition
            void this.dropdown.offsetWidth;
            
            this.dropdown.classList.add('show');
            this.renderCalendar();
        }
    }

    closeCalendar() {
        if (this.isInline) return;
        this.dropdown.classList.remove('show');
        setTimeout(() => {
            if(!this.dropdown.classList.contains('show')) {
                this.dropdown.style.display = 'none';
            }
        }, 300);
    }

    changeMonth(delta) {
        this.currentDate = this.currentDate.add(delta, 'month');
        this.renderCalendar();
    }

    renderCalendar() {
        this.monthDisplay.textContent = this.currentDate.format('MMMM YYYY');

        // Fetch data for counts
        // const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        // const schedules = JSON.parse(localStorage.getItem('schedules')) || [];
        const tasks = this.tasks;
        const schedules = this.schedules;

        const dayElements = this.grid.querySelectorAll('.calendar-day');
        dayElements.forEach(el => el.remove());

        const startOfMonth = this.currentDate.startOf('month');
        const firstDayOfWeek = startOfMonth.day();
        const daysInMonth = this.currentDate.daysInMonth();
        
        const today = dayjs();

        // Empty slots
        for (let i = 0; i < firstDayOfWeek; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            this.grid.appendChild(empty);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            
            // Create a span for the number to control positioning
            const dayNumberSpn = document.createElement('span');
            dayNumberSpn.className = 'day-number';
            dayNumberSpn.textContent = i;
            dayEl.appendChild(dayNumberSpn);
            
            const dayDate = this.currentDate.date(i);
            const dateStr = dayDate.format('YYYY-MM-DD');

            if (this.isInline) {
                 const tasksForDay = tasks.filter(t => t.dueDate === dateStr).length;
                 const schedulesForDay = schedules.filter(s => s.date === dateStr).length;
                 const totalItems = tasksForDay + schedulesForDay;
                 
                 if (totalItems > 0) {
                     const indicator = document.createElement('div');
                     indicator.className = 'day-indicator';
                     indicator.textContent = totalItems > 99 ? '99+' : totalItems;
                     dayEl.prepend(indicator); // Add BEFORE the number (above)
                     dayEl.classList.add('has-items');
                 }
            }

            if (today.isSame(dayDate, 'day')) {
                dayEl.classList.add('today');
            }

            if (this.selectedDate && this.selectedDate.isSame(dayDate, 'day')) {
                dayEl.classList.add('selected');
            }

            if (dayDate.isBefore(today, 'day') && !this.isInline) {
                 // Only disable past dates for input pickers, maybe? 
                 // kept original logic:
                dayEl.classList.add('disabled');
            } else {
                 if(dayDate.isBefore(today, 'day')) {
                    // For inline calendar we might want to allow clicking past events or just view them
                    // But original code disabled them. Let's keep consistent for now unless requested.
                    dayEl.classList.add('disabled');
                 } else {
                    dayEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.selectDate(dayDate);
                    });
                 }
            }
            
            // Fix: Override disabled check for Inline viewer if we want to see past events?
            // The user didn't ask to see past events, just count.
            // But if it's disabled, the style opacity makes it hard to see.
            // Let's relax the disabled style for inline in CSS if needed, or remove disabled class for inline logic.
            // For now, I'll stick to replacing the render logic block.

            // Actually, wait. The original code block:
            /*
            if (dayDate.isBefore(today, 'day')) {
                dayEl.classList.add('disabled');
            } else {
                dayEl.addEventListener('click', ...);
            }
            */
            // I should preserve this exactly to avoid regressions, except maybe for inline if I want interactivity.
            // For now, I will use the exact replacement logic but insert the count.
            
            // RESET innerHTML logic above.
            // I used appendChild / prepend.
            
            // We need to re-apply the listener logic correctly.
             if (dayDate.isBefore(today, 'day') && !this.isInline) {
                dayEl.classList.add('disabled');
            } else {
                dayEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectDate(dayDate);
                });
            }

            this.grid.appendChild(dayEl);
        }
    }

    selectDate(date) {
        this.selectedDate = date;
        
        if (!this.isInline) {
            this.hiddenInput.value = date.format('YYYY-MM-DD');
            this.trigger.querySelector('.text').textContent = date.format('MMM D, YYYY');
            this.trigger.classList.add('has-value');
            this.closeCalendar();
        } else {
            // Inline mode: Show details modal
            const dateStr = date.format('YYYY-MM-DD');
            // const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            // const schedules = JSON.parse(localStorage.getItem('schedules')) || [];
            
            const dayTasks = this.tasks.filter(t => t.dueDate === dateStr).map(t => ({...t, type: 'task'}));
            const daySchedules = this.schedules.filter(s => s.date === dateStr).map(s => ({...s, type: 'schedule'}));
            
            const allItems = [...dayTasks, ...daySchedules];
            
            showDayDetailsModal(date.format('MMMM D, YYYY'), allItems);
            
            // Re-render to show selection state
            this.renderCalendar();
        }
    }
}
