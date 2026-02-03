import dayjs from 'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/+esm';
import { showDayDetailsModal } from './modals.js';
import { dbService } from '../services/db.js';
import { store } from '../store.js';

export class Calendar {

  /* ======================================================
     CONSTRUCTOR
     - Suporta modo legacy e modo config
     - Inicializa estado e subscriptions
  ====================================================== */
  constructor(optionsOrTrigger, inputSelector) {
    this.currentDate = dayjs();
    this.selectedDate = null;

    this.tasks = store.getTasks();
    this.schedules = store.getSchedules();

    this.isInline = false;

    this.resolveMode(optionsOrTrigger, inputSelector);
    if (!this.validate()) return;

    this.subscribeToData();
    this.init();
  }

  /* ======================================================
     MODE RESOLUTION
  ====================================================== */
  resolveMode(optionsOrTrigger, inputSelector) {
    // Legacy mode: (triggerSelector, inputSelector)
    if (typeof optionsOrTrigger === 'string') {
      this.trigger = document.querySelector(optionsOrTrigger);
      this.hiddenInput = document.querySelector(inputSelector);
      this.isInline = false;
      return;
    }

    // Config object mode
    const { triggerSelector, inputSelector: inputSel, containerSelector } = optionsOrTrigger;

    if (containerSelector) {
      this.container = document.querySelector(containerSelector);
      this.isInline = true;
    } else {
      this.trigger = document.querySelector(triggerSelector);
      this.hiddenInput = document.querySelector(inputSel);
      this.isInline = false;
    }
  }

  validate() {
    if (this.isInline) return !!this.container;
    return !!this.trigger && !!this.hiddenInput;
  }

  /* ======================================================
     DATA SUBSCRIPTIONS
  ====================================================== */
  subscribeToData() {
    store.addEventListener('tasksUpdated', (e) => {
      this.tasks = e.detail;
      this.renderCalendar();
    });

    store.addEventListener('schedulesUpdated', (e) => {
      this.schedules = e.detail;
      this.renderCalendar();
    });
  }

  /* ======================================================
     INIT
  ====================================================== */
  init() {
    this.createCalendarStructure();
    this.attachEvents();
    this.renderCalendar();
  }

  /* ======================================================
     DOM STRUCTURE
  ====================================================== */
  createCalendarStructure() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = this.isInline ? 'calendar-inline' : 'calendar-dropdown';

    this.createHeader();
    this.createGrid();

    this.wrapper.append(this.header, this.grid);

    if (this.isInline) {
      this.container.appendChild(this.wrapper);
    } else {
      this.dropdown = this.wrapper;
      this.trigger.after(this.dropdown);
    }
  }

  createHeader() {
    this.header = document.createElement('div');
    this.header.className = 'calendar-header';

    const prev = this.createNavButton(-1);
    const next = this.createNavButton(1);

    this.monthDisplay = document.createElement('h3');

    this.header.append(prev, this.monthDisplay, next);
  }

  createNavButton(direction) {
    const btn = document.createElement('button');
    btn.className = `calendar-nav-btn ${direction < 0 ? 'prev' : 'next'}`;
    btn.innerHTML = direction < 0 ? '‹' : '›';

    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.changeMonth(direction);
    });

    return btn;
  }

  createGrid() {
    this.grid = document.createElement('div');
    this.grid.className = 'calendar-grid';

    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(day => {
      const el = document.createElement('div');
      el.className = 'calendar-day-name';
      el.textContent = day;
      this.grid.appendChild(el);
    });
  }

  /* ======================================================
     EVENTS
  ====================================================== */
  attachEvents() {
    if (this.isInline) return;

    this.trigger.addEventListener('click', e => {
      e.stopPropagation();
      this.toggleCalendar();
    });

    document.addEventListener('click', e => {
      if (
        this.dropdown &&
        !this.dropdown.contains(e.target) &&
        !this.trigger.contains(e.target)
      ) {
        this.closeCalendar();
      }
    });
  }

  toggleCalendar() {
    if (this.dropdown.classList.contains('show')) {
      this.closeCalendar();
    } else {
      this.dropdown.style.display = 'block';
      void this.dropdown.offsetWidth;
      this.dropdown.classList.add('show');
      this.renderCalendar();
    }
  }

  closeCalendar() {
    this.dropdown.classList.remove('show');
    setTimeout(() => {
      if (!this.dropdown.classList.contains('show')) {
        this.dropdown.style.display = 'none';
      }
    }, 300);
  }

  /* ======================================================
     CALENDAR LOGIC
  ====================================================== */
  changeMonth(delta) {
    this.currentDate = this.currentDate.add(delta, 'month');
    this.renderCalendar();
  }

  renderCalendar() {
    this.monthDisplay.textContent = this.currentDate.format('MMMM YYYY');

    // Remove old days
    this.grid.querySelectorAll('.calendar-day').forEach(d => d.remove());

    const start = this.currentDate.startOf('month');
    const daysInMonth = this.currentDate.daysInMonth();
    const offset = start.day();
    const today = dayjs();

    // Empty slots
    for (let i = 0; i < offset; i++) {
      this.grid.appendChild(this.createEmptyDay());
    }

    // Real days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = this.currentDate.date(day);
      this.grid.appendChild(this.createDayCell(date, today));
    }
  }

  createEmptyDay() {
    const el = document.createElement('div');
    el.className = 'calendar-day empty';
    return el;
  }

  createDayCell(date, today) {
    const el = document.createElement('div');
    el.className = 'calendar-day';

    const number = document.createElement('span');
    number.className = 'day-number';
    number.textContent = date.date();
    el.appendChild(number);

    this.applyDayState(el, date, today);
    this.applyInlineIndicators(el, date);

    return el;
  }

  applyDayState(el, date, today) {
    if (today.isSame(date, 'day')) el.classList.add('today');
    if (this.selectedDate?.isSame(date, 'day')) el.classList.add('selected');

    if (!this.isInline && date.isBefore(today, 'day')) {
      el.classList.add('disabled');
      return;
    }

    el.addEventListener('click', e => {
      e.stopPropagation();
      this.selectDate(date);
    });
  }

  applyInlineIndicators(el, date) {
    if (!this.isInline) return;

    const dateStr = date.format('YYYY-MM-DD');

    const count =
      this.tasks.filter(t => t.dueDate === dateStr).length +
      this.schedules.filter(s => s.date === dateStr).length;

    if (count > 0) {
      const badge = document.createElement('div');
      badge.className = 'day-indicator';
      badge.textContent = count > 99 ? '99+' : count;
      el.prepend(badge);
      el.classList.add('has-items');
    }
  }

  /* ======================================================
     SELECTION
  ====================================================== */
  selectDate(date) {
    this.selectedDate = date;

    if (!this.isInline) {
      this.hiddenInput.value = date.format('YYYY-MM-DD');
      this.trigger.querySelector('.text').textContent = date.format('MMM D, YYYY');
      this.trigger.classList.add('has-value');
      this.closeCalendar();
      return;
    }

    const dateStr = date.format('YYYY-MM-DD');

    const items = [
      ...this.tasks.filter(t => t.dueDate === dateStr).map(t => ({ ...t, type: 'task' })),
      ...this.schedules.filter(s => s.date === dateStr).map(s => ({ ...s, type: 'schedule' }))
    ];

    showDayDetailsModal(date.format('MMMM D, YYYY'), items);
    this.renderCalendar();
  }
}
