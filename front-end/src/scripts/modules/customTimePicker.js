
export class CustomTimePicker {
    constructor(triggerSelector, inputSelector) {
        this.trigger = document.querySelector(triggerSelector);
        this.input = document.querySelector(inputSelector);
        
        if (!this.trigger || !this.input) return;

        this.container = this.trigger.parentElement;
        this.dropdown = null;
        this.selectedHour = null;
        this.selectedMinute = null;

        this.init();
    }

    init() {
        this.createDropdown();
        this.attachEvents();
    }

    createDropdown() {
        // Check if dropdown already exists
        if (this.container.querySelector('.time-dropdown')) return;

        this.dropdown = document.createElement('div');
        this.dropdown.classList.add('time-dropdown');
        
        const header = document.createElement('div');
        header.classList.add('time-header');
        header.textContent = 'Select Time';
        
        const selector = document.createElement('div');
        selector.classList.add('time-selector');

        const hoursColumn = this.createColumn(24, 'hour');
        
        const separator = document.createElement('div');
        separator.classList.add('time-separator');
        separator.textContent = ':';
        
        const minutesColumn = this.createColumn(60, 'minute');

        selector.appendChild(hoursColumn);
        selector.appendChild(separator);
        selector.appendChild(minutesColumn);

        this.dropdown.appendChild(header);
        this.dropdown.appendChild(selector);
        
        this.container.appendChild(this.dropdown);
    }

    createColumn(count, type) {
        const column = document.createElement('div');
        column.classList.add('time-column', type);

        for (let i = 0; i < count; i++) {
            const value = i.toString().padStart(2, '0');
            const option = document.createElement('div');
            option.classList.add('time-option');
            option.textContent = value;
            option.dataset.value = value;
            option.dataset.type = type;
            
            option.addEventListener('click', (e) => this.handleSelection(e, type, value));
            
            column.appendChild(option);
        }
        
        return column;
    }

    handleSelection(e, type, value) {
        e.stopPropagation();
        
        // Remove active class from siblings
        const siblings = e.target.parentElement.children;
        Array.from(siblings).forEach(el => el.classList.remove('selected'));
        
        // Add active class
        e.target.classList.add('selected');

        if (type === 'hour') {
            this.selectedHour = value;
        } else {
            this.selectedMinute = value;
        }

        this.updateValue();
    }

    updateValue() {
        if (this.selectedHour !== null && this.selectedMinute !== null) {
            const timeString = `${this.selectedHour}:${this.selectedMinute}`;
            this.input.value = timeString;
            
            const textSpan = this.trigger.querySelector('.text');
            if (textSpan) textSpan.textContent = timeString;
            
            this.trigger.classList.add('has-value');
        }
    }

    attachEvents() {
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    toggleDropdown() {
        // Close other dropdowns if needed (optional)
        const allDropdowns = document.querySelectorAll('.time-dropdown.show, .calendar-dropdown.show');
        allDropdowns.forEach(d => {
            if (d !== this.dropdown) d.classList.remove('show');
        });

        this.dropdown.classList.toggle('show');
        
        if (this.dropdown.classList.contains('show')) {
            this.scrollToSelected();
        }
    }

    closeDropdown() {
        if (this.dropdown) {
            this.dropdown.classList.remove('show');
        }
    }

    scrollToSelected() {
        if(this.selectedHour) {
             const hourEl = this.dropdown.querySelector(`.time-column.hour .time-option[data-value="${this.selectedHour}"]`);
             if(hourEl) hourEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        if(this.selectedMinute) {
             const minEl = this.dropdown.querySelector(`.time-column.minute .time-option[data-value="${this.selectedMinute}"]`);
             if(minEl) minEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }
}
