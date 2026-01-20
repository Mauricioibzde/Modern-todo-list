import dayjs from 'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/+esm';

export class Calendar {
    constructor(triggerSelector, inputSelector) {
        this.trigger = document.querySelector(triggerSelector);
        this.hiddenInput = document.querySelector(inputSelector);
        
        if (!this.trigger || !this.hiddenInput) return;

        this.currentDate = dayjs();
        this.selectedDate = null;
        
        this.init();
    }

    init() {
        this.createCalendarStructure();
        this.attachEvents();
        this.renderCalendar();
    }

    createCalendarStructure() {
        // Create dropdown container
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'calendar-dropdown';
        
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

        this.daysContainer = document.createDocumentFragment(); // Wrapper logic handled in render

        this.dropdown.appendChild(this.header);
        this.dropdown.appendChild(this.grid);
        
        // Insert after trigger
        this.trigger.parentNode.insertBefore(this.dropdown, this.trigger.nextSibling);

        // Bind nav events
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault(); // prevent form submit
            e.stopPropagation();
            this.changeMonth(-1);
        });
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault(); // prevent form submit
            e.stopPropagation();
            this.changeMonth(1);
        });
    }

    attachEvents() {
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCalendar();
        });

        document.addEventListener('click', (e) => {
            if (!this.dropdown.contains(e.target) && !this.trigger.contains(e.target)) {
                this.closeCalendar();
            }
        });
    }

    toggleCalendar() {
        this.dropdown.classList.toggle('show');
        const isVisible = this.dropdown.classList.contains('show');
        if (isVisible) {
            // Reposition if needed or refresh
            this.renderCalendar();
        }
    }

    closeCalendar() {
        this.dropdown.classList.remove('show');
    }

    changeMonth(delta) {
        this.currentDate = this.currentDate.add(delta, 'month');
        this.renderCalendar();
    }

    renderCalendar() {
        this.monthDisplay.textContent = this.currentDate.format('MMMM YYYY');

        // Clear existing days
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
            dayEl.textContent = i;
            
            const dayDate = this.currentDate.date(i);

            // Check if today
            if (today.isSame(dayDate, 'day')) {
                dayEl.classList.add('today');
            }

            // Check if selected
            if (this.selectedDate && this.selectedDate.isSame(dayDate, 'day')) {
                dayEl.classList.add('selected');
            }

            // Check if past
            if (dayDate.isBefore(today, 'day')) {
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
        
        // Update Hidden Input (YYYY-MM-DD format for consistency)
        this.hiddenInput.value = date.format('YYYY-MM-DD');

        // Update Trigger Text
        this.trigger.querySelector('.text').textContent = date.format('MMM D, YYYY');
        this.trigger.classList.add('has-value');

        this.closeCalendar();
        this.renderCalendar(); // Re-render to show selected state
    }
}
