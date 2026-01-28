export class CustomTimePicker {

  /* =====================================================
     CONFIG
  ===================================================== */
  static CONFIG = {
    HOURS: 24,
    MINUTES: 60,
    LOOP_COUNT: 50,
    DEFAULT_TIME: '00:00',
    ANIMATION_DELAY: 300
  };

  /* =====================================================
     CONSTRUCTOR
  ===================================================== */
  constructor(triggerSelector, inputSelector) {
    this.trigger = document.querySelector(triggerSelector);
    this.input = document.querySelector(inputSelector);

    if (!this.trigger || !this.input) return;

    this.container = this.trigger.parentElement;
    this.dropdown = null;

    // Internal state
    this.selectedHour = null;
    this.selectedMinute = null;

    this.init();
  }

  /* =====================================================
     INIT
  ===================================================== */
  init() {
    this.createDropdown();
    this.attachEvents();
    this.validateAndSetTime(this.input.value);
  }

  /* =====================================================
     DOM CREATION
  ===================================================== */
  createDropdown() {
    const existing = this.container.querySelector('.time-dropdown');
    if (existing) {
      this.dropdown = existing;
      return;
    }

    this.dropdown = document.createElement('div');
    this.dropdown.className = 'time-dropdown';

    this.dropdown.innerHTML = `
      <div class="time-header">Select Time</div>
      <div class="time-selector">
        ${this.createColumnHTML(CustomTimePicker.CONFIG.HOURS, 'hour')}
        <div class="time-separator">:</div>
        ${this.createColumnHTML(CustomTimePicker.CONFIG.MINUTES, 'minute')}
      </div>
    `;

    this.container.appendChild(this.dropdown);
    this.bindColumnEvents();
  }

  createColumnHTML(count, type) {
    let html = `<div class="time-column ${type}">`;

    for (let loop = 0; loop < CustomTimePicker.CONFIG.LOOP_COUNT; loop++) {
      for (let i = 0; i < count; i++) {
        const val = i.toString().padStart(2, '0');
        html += `<div class="time-option" data-type="${type}" data-value="${val}">${val}</div>`;
      }
    }

    html += '</div>';
    return html;
  }

  /* =====================================================
     EVENTS
  ===================================================== */
  attachEvents() {
    this.trigger.addEventListener('click', e => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    document.addEventListener('click', e => {
      if (!this.container.contains(e.target)) {
        this.closeDropdown();
      }
    });
  }

  bindColumnEvents() {
    this.dropdown.addEventListener('click', e => {
      const option = e.target.closest('.time-option');
      if (!option) return;

      e.stopPropagation();
      this.handleSelection(option);
    });
  }

  /* =====================================================
     SELECTION LOGIC
  ===================================================== */
  handleSelection(option) {
    const { type, value } = option.dataset;
    const column = option.parentElement;

    // Clear previous selections
    column.querySelectorAll('.time-option.selected')
      .forEach(el => el.classList.remove('selected'));

    // Highlight all duplicates
    column.querySelectorAll(`.time-option[data-value="${value}"]`)
      .forEach(el => el.classList.add('selected'));

    if (type === 'hour') this.selectedHour = value;
    if (type === 'minute') this.selectedMinute = value;

    this.updateValue();
  }

  updateValue() {
    const h = this.selectedHour ?? '00';
    const m = this.selectedMinute ?? '00';

    const time = `${h}:${m}`;
    this.input.value = time;

    const text = this.trigger.querySelector('.text');
    if (text) text.textContent = time;

    this.trigger.classList.add('has-value');
  }

  /* =====================================================
     DROPDOWN CONTROL
  ===================================================== */
  toggleDropdown() {
    this.closeOtherDropdowns();

    if (this.dropdown.classList.contains('show')) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.dropdown.style.display = 'block';
    void this.dropdown.offsetWidth;
    this.dropdown.classList.add('show');
    this.scrollToSelected();
  }

  closeDropdown() {
    this.dropdown.classList.remove('show');
    setTimeout(() => {
      if (!this.dropdown.classList.contains('show')) {
        this.dropdown.style.display = 'none';
      }
    }, CustomTimePicker.CONFIG.ANIMATION_DELAY);
  }

  closeOtherDropdowns() {
    document
      .querySelectorAll('.time-dropdown.show, .calendar-dropdown.show')
      .forEach(d => {
        if (d !== this.dropdown) {
          d.classList.remove('show');
          setTimeout(() => d.style.display = 'none', CustomTimePicker.CONFIG.ANIMATION_DELAY);
        }
      });
  }

  /* =====================================================
     SCROLL SYNC
  ===================================================== */
  scrollToSelected() {
    const scroll = (type, value) => {
      const column = this.dropdown.querySelector(`.time-column.${type}`);
      if (!column) return;

      const matches = column.querySelectorAll(`.time-option[data-value="${value}"]`);
      if (!matches.length) return;

      const middle = matches[Math.floor(matches.length / 2)];
      setTimeout(() => middle.scrollIntoView({ block: 'center' }), 50);
    };

    scroll('hour', this.selectedHour ?? '00');
    scroll('minute', this.selectedMinute ?? '00');
  }

  /* =====================================================
     INPUT VALIDATION
  ===================================================== */
  validateAndSetTime(value) {
    if (!value) return;

    let h, m;

    if (value.includes(':')) {
      [h, m] = value.split(':').map(Number);
    } else if (value.length === 4) {
      h = Number(value.slice(0, 2));
      m = Number(value.slice(2, 4));
    }

    if (this.isValidTime(h, m)) {
      this.selectedHour = h.toString().padStart(2, '0');
      this.selectedMinute = m.toString().padStart(2, '0');
      this.updateValue();
    }
  }

  isValidTime(h, m) {
    return (
      Number.isInteger(h) &&
      Number.isInteger(m) &&
      h >= 0 && h <= 23 &&
      m >= 0 && m <= 59
    );
  }
}
