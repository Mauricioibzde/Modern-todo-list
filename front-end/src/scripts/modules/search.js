import { dbService } from '../services/db.js';
import { store } from '../store.js';
import { getIcon } from '../utils/icons.js';

/* ======================================================
   STATE
====================================================== */

const state = {
  term: '',
  type: 'all',       // all | task | schedule
  priority: 'all',   // all | low | medium | high | extreme
  category: 'all'
};

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
  task: getIcon(''),
  schedule: getIcon('')
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
  store.addEventListener('tasksUpdated', () => {
     performSearch();
     updateCategoryFilter();
  });
  store.addEventListener('schedulesUpdated', () => {
     performSearch();
     updateCategoryFilter();
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
    // Toggle hidden class logic
    if (options.classList.contains('hidden')) {
        options.classList.remove('hidden');
        // Small delay to allow CSS transition to work if needed, 
        // though with display:none->block transitions don't work well without animation frames.
        // For now, just removing hidden is enough to show it.
        requestAnimationFrame(() => options.classList.add('show'));
    } else {
        options.classList.remove('show');
        options.classList.add('hidden');
    }
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
    
    // Close dropdown
    options.classList.remove('show');
    options.classList.add('hidden');
    trigger.classList.remove('active');

    onSelect(value);
  });
}

function closeAllDropdowns() {
  document
    .querySelectorAll('.filter-select-options')
    .forEach(el => {
        el.classList.remove('show');
        el.classList.add('hidden');
    });

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

  store.getTasks().forEach(t => categories.set(t.category, t.category));
  store.getSchedules().forEach(s => categories.set(s.category, s.category));

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
    ...store.getTasks().map(t => normalizeItem(t, 'task')),
    ...store.getSchedules().map(s => normalizeItem(s, 'schedule'))
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
        <div class="status-task"></div>
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
