
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
        const existingDropdown = this.container.querySelector('.time-dropdown');
        if (existingDropdown) {
            this.dropdown = existingDropdown;
            return;
        }

        this.dropdown = document.createElement('div');
        this.dropdown.classList.add('time-dropdown');
        
        const header = document.createElement('div');
        header.classList.add('time-header');
        header.textContent = 'Select Time';
        
        const selector = document.createElement('div');
        selector.classList.add('time-selector');

        // Create Hours Column
        const hoursColumn = this.createColumn(24, 'hour');
        
        const separator = document.createElement('div');
        separator.classList.add('time-separator');
        separator.textContent = ':';
        
        // Create Minutes Column
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

        // Infinite Scroll Illusion: Duplicate the list multiple times
        // 50 copies of the set ensures plenty of scroll room
        const loopCount = 50; 

        for (let j = 0; j < loopCount; j++) {
            for (let i = 0; i < count; i++) {
                const val = i.toString().padStart(2, '0');
                const option = document.createElement('div');
                option.classList.add('time-option');
                option.textContent = val;
                option.dataset.value = val;
                
                // Add a unique ID or index if needed, but data-value is enough for selection
                option.addEventListener('click', (e) => this.handleSelection(e, type, val));
                column.appendChild(option);
            }
        }
        return column;
    }

    handleSelection(e, type, value) {
        e.stopPropagation();
        
        // Clear 'selected' from ALL items in this column
        const column = e.target.parentElement;
        const allOptions = column.querySelectorAll('.time-option');
        allOptions.forEach(el => el.classList.remove('selected'));
        
        // Add 'selected' to ALL duplicate items with the same value
        const matchingOptions = column.querySelectorAll(`.time-option[data-value="${value}"]`);
        matchingOptions.forEach(el => el.classList.add('selected'));

        if(type === 'hour') {
            this.selectedHour = value;
        } else {
            this.selectedMinute = value;
        }

        this.updateValue();
    }

    updateValue() {
        // If one is missing, use default
        const h = this.selectedHour || '00';
        const m = this.selectedMinute || '00';
        
        const timeString = `${h}:${m}`;
        this.input.value = timeString;
        
        // Update display text (span)
        const textSpan = this.trigger.querySelector('.text');
        if (textSpan) textSpan.textContent = timeString;
        
        this.trigger.classList.add('has-value');

        // Only close if BOTH are explicitly selected? 
        // Or keep open to allow minute adjustment.
        // Let's NOT auto-close immediately to allow adjustment.
        // Or maybe check if strict selection took place?
        // For better UX, let user click off to close, or close after minute selection if hour was already selected?
        
        if(this.selectedHour && this.selectedMinute) {
             // Maybe wait a bit?
        }
    }

    // Unused now
    handleTimeSelection() {} 


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

    validateAndSetTime(val) {
        // Simple parser
        if (!val) return;
        
        let h, m;

        if (val.includes(':')) {
            const parts = val.split(':');
            h = parseInt(parts[0]);
            m = parseInt(parts[1]);
        } else if (val.length === 4) {
            // 0930 format
            h = parseInt(val.substring(0, 2));
            m = parseInt(val.substring(2, 4));
        }

        if (h !== undefined && !isNaN(h) && m !== undefined && !isNaN(m)) {
            // Validate ranges
            if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                 this.selectedHour = h.toString().padStart(2, '0');
                 this.selectedMinute = m.toString().padStart(2, '0');
                 this.updateValue(); // Valid update
                 return;
            }
        }
        
        // If invalid, re-render currently selected or clear if none
        if (this.selectedHour && this.selectedMinute) {
             this.updateValue(); 
        } else {
            // Invalid and no state, maybe clear?
            // Keep user input? No, enforce format.
            // this.updateValue() uses defaults 00:00 in current logic which might be annoying if user just cleared it on purpose.
            // But let's stick to safe defaults.
        }
    }

    toggleDropdown() {
        // Close other dropdowns if needed
        const allDropdowns = document.querySelectorAll('.time-dropdown.show, .calendar-dropdown.show');
        allDropdowns.forEach(d => {
            if (d !== this.dropdown) {
                d.classList.remove('show');
                // Ensure they get hidden if they have inline styles
                setTimeout(() => { if(!d.classList.contains('show')) d.style.display = 'none'; }, 300);
            }
        });

        if (this.dropdown.classList.contains('show')) {
            this.closeDropdown();
        } else {
            this.dropdown.style.display = 'block';
            // Force reflow
            void this.dropdown.offsetWidth;
            this.dropdown.classList.add('show');
            this.scrollToSelected();
        }
    }

    closeDropdown() {
        if (this.dropdown) {
            this.dropdown.classList.remove('show');
            setTimeout(() => {
                // Check if it's still closed before hiding (prevent race condition if quickly reopened)
                if (!this.dropdown.classList.contains('show')) {
                    this.dropdown.style.display = 'none';
                }
            }, 300);
        }
    }

    scrollToSelected() {
        // Helper to scroll to the middle-most instance of the value
        const scrollColumn = (type, value) => {
            const column = this.dropdown.querySelector(`.time-column.${type}`);
            if(!column || !value) return;

            const allMatches = column.querySelectorAll(`.time-option[data-value="${value}"]`);
            if(allMatches.length > 0) {
                 // Pick the middle instance to allow scrolling both ways
                 const middleIndex = Math.floor(allMatches.length / 2);
                 const targetEl = allMatches[middleIndex];
                 
                 setTimeout(() => targetEl.scrollIntoView({ block: 'center' }), 50);
            }
        };

        if(this.selectedHour) scrollColumn('hour', this.selectedHour);
        // Default scroll to 00 middle if not selected
        else scrollColumn('hour', '00'); 

        if(this.selectedMinute) scrollColumn('minute', this.selectedMinute);
        else scrollColumn('minute', '00');
    }
}
