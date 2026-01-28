import { dbService } from '../services/db.js';

/* ======================================================
   STATE
====================================================== */

const state = {
  term: '',
  type: 'all',       // all | task | schedule
  priority: 'all',   // all | low | medium | high | extreme
  category: 'all'
};

let tasks = [];
let schedules = [];

/* ======================================================
   DOM REFERENCES
====================================================== */

const searchInput = document.getElementById('search-input');
const searchResultsUl = document.querySelector('.search-results-ul');
const categoryFilterOptions = document.getElementById('filter-category-options');

/* ======================================================
   ICONS
====================================================== */

const ICONS = {
  task: `📋`,
  schedule: `⏰`
};

/* ======================================================
   INIT
====================================================== */

export function initSearch() {
  subscribeToData();
  setupSearchInput();
  setupFilters();
}

/* ======================================================
   DATA SUBSCRIPTIONS
====================================================== */

function subscribeToData() {
  dbService.onTasksSnapshot(data => {
    tasks = data;
    updateCategoryFilter();
    performSearch();
  });

  dbService.onSchedulesSnapshot(data => {
    schedules = data;
    updateCategoryFilter();
    performSearch();
  });
}

/* ======================================================
   INPUT & FILTERS
====================================================== */

function setupSearchInput() {
  if (!searchInput) return;

  searchInput.addEventListener('input', e => {
    state.term = e.target.value.toLowerCase();
    performSearch();
  });
}

function setupFilters() {
  setupCustomSelect('filter-type', val => {
    state.type = val;
    performSearch();
  });

  setupCustomSelect('filter-priority', val => {
    state.priority = val;
    performSearch();
  });

  setupCustomSelect('filter-category', val => {
    state.category = val;
    performSearch();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.custom-filter-select')) {
      closeAllDropdowns();
    }
  });
}

/* ======================================================
   CUSTOM SELECT
====================================================== */

function setupCustomSelect(id, onSelect) {
  const container = document.getElementById(id);
  if (!container) return;

  const trigger = container.querySelector('.filter-select-trigger');
  const options = container.querySelector('.filter-select-options');
  const label = trigger.querySelector('span');

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    closeAllDropdowns();
    options.classList.toggle('show');
    trigger.classList.toggle('active');
  });

  container.addEventListener('click', e => {
    const option = e.target.closest('.filter-option');
    if (!option) return;

    const value = option.dataset.value;
    label.textContent = option.textContent;

    container
      .querySelectorAll('.filter-option')
      .forEach(o => o.classList.remove('selected'));

    option.classList.add('selected');
    options.classList.remove('show');
    trigger.classList.remove('active');

    onSelect(value);
  });
}

function closeAllDropdowns() {
  document
    .querySelectorAll('.filter-select-options')
    .forEach(el => el.classList.remove('show'));

  document
    .querySelectorAll('.filter-select-trigger')
    .forEach(el => el.classList.remove('active'));
}

/* ======================================================
   CATEGORY FILTER
====================================================== */

function updateCategoryFilter() {
  if (!categoryFilterOptions) return;

  const categories = new Map();

  const taskCats =
    JSON.parse(localStorage.getItem('customCategories')) || [];
  const schedCats =
    JSON.parse(localStorage.getItem('scheduleCategories')) || [];

  [...taskCats, ...schedCats].forEach(c =>
    categories.set(c.value, c.label || c.value)
  );

  tasks.forEach(t => categories.set(t.category, t.category));
  schedules.forEach(s => categories.set(s.category, s.category));

  categoryFilterOptions.innerHTML =
    `<div class="filter-option selected" data-value="all">All Categories</div>`;

  categories.forEach((label, value) => {
    const div = document.createElement('div');
    div.className = 'filter-option';
    div.dataset.value = value;
    div.textContent = capitalize(label);
    categoryFilterOptions.appendChild(div);
  });
}

/* ======================================================
   SEARCH LOGIC
====================================================== */

function performSearch() {
  const items = normalizeItems();
  const filtered = items.filter(matchesFilters);
  renderResults(filtered);
}

function normalizeItems() {
  return [
    ...tasks.map(t => normalizeItem(t, 'task')),
    ...schedules.map(s => normalizeItem(s, 'schedule'))
  ];
}

function normalizeItem(item, type) {
  return {
    ...item,
    type,
    dateDisplay:
      type === 'task'
        ? `Due: ${item.dueDate}`
        : `${item.date} at ${item.time}`,
    priority: getPriority(item.category, type)
  };
}

function matchesFilters(item) {
  const matchesTerm =
    !state.term ||
    item.title.toLowerCase().includes(state.term) ||
    item.description.toLowerCase().includes(state.term);

  const matchesType =
    state.type === 'all' || item.type === state.type;

  const matchesCategory =
    state.category === 'all' ||
    item.category === state.category;

  const matchesPriority =
    state.priority === 'all' ||
    item.priority === state.priority;

  return (
    matchesTerm &&
    matchesType &&
    matchesCategory &&
    matchesPriority
  );
}

/* ======================================================
   PRIORITY
====================================================== */

function getPriority(category, type) {
  const key =
    type === 'task'
      ? 'customCategories'
      : 'scheduleCategories';

  const categories =
    JSON.parse(localStorage.getItem(key)) || [];

  return (
    categories.find(c => c.value === category)?.priority ||
    'low'
  );
}

/* ======================================================
   RENDER RESULTS
====================================================== */

function renderResults(items) {
  if (!searchResultsUl) return;

  searchResultsUl.innerHTML = '';

  if (!items.length) {
    searchResultsUl.innerHTML =
      `<li class="no-tasks-found">No items found.</li>`;
    return;
  }

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'schedule-item';

    li.innerHTML = `
      <div class="task-header">
        <div class="status-task">${ICONS[item.type]}</div>
        <span class="name-task">
          <span class="priority-dot ${item.priority}"></span>
          ${item.title}
        </span>
        <span class="date-task">${item.dateDisplay}</span>
      </div>

      <div class="description">
        <span>${item.description}</span>
        <div class="meta">
          <span>Category: ${item.category}</span>
          <span class="badge">${item.type.toUpperCase()}</span>
        </div>
      </div>
    `;

    li.addEventListener('click', () =>
      li.querySelector('.description').classList.toggle('expanded')
    );

    searchResultsUl.appendChild(li);
  });
}

/* ======================================================
   UTILS
====================================================== */

function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
