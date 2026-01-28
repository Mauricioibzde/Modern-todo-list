import { showToast } from './alerts.js';

/* ======================================================
   CONFIG
====================================================== */

const DEFAULT_PLACEHOLDER = 'Select Category';
const DEFAULT_STORAGE_KEY = 'customCategories';

/* ======================================================
   INIT
====================================================== */

export function initCustomSelects() {
  document
    .querySelectorAll('.custom-category')
    .forEach(setupCustomSelect);
}

/* ======================================================
   MAIN SETUP
====================================================== */

function setupCustomSelect(container) {
  if (container.dataset.initialized) return;
  container.dataset.initialized = 'true';

  const inputId = container.dataset.inputId || 'category';
  const storageKey = container.dataset.storageKey || DEFAULT_STORAGE_KEY;

  const hiddenInput = createHiddenInput(inputId);
  const selectedDiv = createSelectedDisplay();
  const optionsContainer = createOptionsContainer();

  container.append(hiddenInput, selectedDiv, optionsContainer);

  renderOptions({ optionsContainer, selectedDiv, hiddenInput, storageKey });
  attachDropdownEvents({ selectedDiv, optionsContainer });
  attachGlobalUpdateListener({ optionsContainer, selectedDiv, hiddenInput, storageKey });
}

/* ======================================================
   ELEMENT FACTORIES
====================================================== */

function createHiddenInput(id) {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'category';
  input.id = id;
  return input;
}

function createSelectedDisplay() {
  const el = document.createElement('div');
  el.className = 'select-selected';
  el.textContent = DEFAULT_PLACEHOLDER;
  return el;
}

function createOptionsContainer() {
  const el = document.createElement('div');
  el.className = 'select-items select-hide';
  return el;
}

/* ======================================================
   RENDERING
====================================================== */

function renderOptions({ optionsContainer, selectedDiv, hiddenInput, storageKey }) {
  optionsContainer.innerHTML = '';

  const customCategories = loadCategories(storageKey);

  customCategories.forEach(cat => {
    optionsContainer.appendChild(
      createOption({
        category: cat,
        isCustom: true,
        selectedDiv,
        hiddenInput,
        optionsContainer,
        storageKey
      })
    );
  });

  optionsContainer.appendChild(
    createAddNewOption({ optionsContainer, selectedDiv, hiddenInput, storageKey })
  );
}

/* ======================================================
   OPTION CREATION
====================================================== */

function createOption({
  category,
  isCustom,
  selectedDiv,
  hiddenInput,
  optionsContainer,
  storageKey
}) {
  const { label, value, priority } = category;

  const option = document.createElement('div');
  option.className = 'select-item';
  option.dataset.value = value;

  if (priority) option.appendChild(createPriorityDot(priority));

  option.appendChild(document.createTextNode(label));

  if (isCustom) {
    option.appendChild(
      createDeleteButton({ label, value, storageKey })
    );
  }

  option.onclick = e => {
    e.stopPropagation();
    selectOption({
      option,
      label,
      value,
      priority,
      selectedDiv,
      hiddenInput,
      optionsContainer
    });
  };

  return option;
}

function createPriorityDot(priority) {
  const dot = document.createElement('span');
  dot.className = `priority-dot ${priority}`;
  return dot;
}

function createDeleteButton({ label, value, storageKey }) {
  const btn = document.createElement('span');
  btn.className = 'delete-category-btn';
  btn.title = 'Delete category';
  btn.innerHTML = '✕';

  btn.onclick = e => {
    e.stopPropagation();
    deleteCategory(storageKey, value);
    showToast(`Category "${label}" deleted`, 'success');
  };

  return btn;
}

/* ======================================================
   SELECTION
====================================================== */

function selectOption({
  option,
  label,
  value,
  priority,
  selectedDiv,
  hiddenInput,
  optionsContainer
}) {
  hiddenInput.value = value;
  selectedDiv.innerHTML = '';

  if (priority) selectedDiv.appendChild(createPriorityDot(priority));
  selectedDiv.appendChild(document.createTextNode(label));

  optionsContainer
    .querySelectorAll('.same-as-selected')
    .forEach(el => el.classList.remove('same-as-selected'));

  option.classList.add('same-as-selected');
  selectedDiv.click();
}

/* ======================================================
   ADD NEW CATEGORY
====================================================== */

function createAddNewOption({ optionsContainer, selectedDiv, hiddenInput, storageKey }) {
  const el = document.createElement('div');
  el.className = 'select-item add-new-category';
  el.textContent = '+ Create New Category';

  el.onclick = e => {
    e.stopPropagation();

    showCategoryModal((name, priority) => {
      if (!name?.trim()) return;

      const value = name.trim().toLowerCase();
      if (categoryExists(storageKey, value)) {
        showToast('Category already exists!', 'warning');
        return;
      }

      saveCategory(storageKey, { label: name.trim(), value, priority });
      dispatchUpdate(storageKey);

      setTimeout(() => {
        optionsContainer
          .querySelector(`[data-value="${value}"]`)
          ?.click();
      }, 50);
    });
  };

  return el;
}

/* ======================================================
   STORAGE
====================================================== */

function loadCategories(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function saveCategory(key, category) {
  const all = loadCategories(key);
  all.push(category);
  localStorage.setItem(key, JSON.stringify(all));
}

function deleteCategory(key, value) {
  const updated = loadCategories(key).filter(c => c.value !== value);
  localStorage.setItem(key, JSON.stringify(updated));
  dispatchUpdate(key);
}

function categoryExists(key, value) {
  return loadCategories(key).some(c => c.value === value);
}

function dispatchUpdate(key) {
  document.dispatchEvent(new CustomEvent(`${key}Updated`));
}

/* ======================================================
   GLOBAL UPDATE HANDLING
====================================================== */

function attachGlobalUpdateListener({ optionsContainer, selectedDiv, hiddenInput, storageKey }) {
  document.addEventListener(`${storageKey}Updated`, () => {
    const current = hiddenInput.value;
    renderOptions({ optionsContainer, selectedDiv, hiddenInput, storageKey });

    if (!current) return;

    const option = optionsContainer.querySelector(`[data-value="${current}"]`);
    if (!option) {
      hiddenInput.value = '';
      selectedDiv.textContent = DEFAULT_PLACEHOLDER;
    }
  });
}

/* ======================================================
   DROPDOWN CONTROL
====================================================== */

function attachDropdownEvents({ selectedDiv, optionsContainer }) {
  selectedDiv.onclick = e => {
    e.stopPropagation();
    closeAllSelect(selectedDiv);
    optionsContainer.classList.toggle('select-hide');
    selectedDiv.classList.toggle('select-arrow-active');
  };
}

function closeAllSelect(active) {
  document.querySelectorAll('.select-selected').forEach(el => {
    if (el !== active) el.classList.remove('select-arrow-active');
  });

  document.querySelectorAll('.select-items').forEach(el => {
    if (!el.previousSibling?.isSameNode(active)) {
      el.classList.add('select-hide');
    }
  });
}

/* ======================================================
   MODAL
====================================================== */

function showCategoryModal(onConfirm) {
  const modal = createModal();

  let selectedPriority = 'low';

  modal.querySelectorAll('.priority-option').forEach(opt => {
    opt.onclick = () => {
      modal.querySelectorAll('.priority-option')
        .forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedPriority = opt.dataset.priority;
    };
  });

  modal.querySelector('.modal-btn-confirm').onclick = () => {
    const val = modal.querySelector('.modal-input').value;
    onConfirm(val, selectedPriority);
    closeModal(modal);
  };

  modal.querySelector('.modal-btn-cancel').onclick = () => closeModal(modal);

  modal.onclick = e => {
    if (e.target === modal) closeModal(modal);
  };

  requestAnimationFrame(() => modal.classList.add('active'));
}

function createModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-content">
      <h3>Create New Category</h3>
      <input class="modal-input" placeholder="Category name" autofocus />

      <div class="modal-priority-selector">
        ${['low','medium','high','extreme']
          .map(p => `<div class="priority-option ${p === 'low' ? 'selected' : ''}" data-priority="${p}">${p}</div>`)
          .join('')}
      </div>

      <div class="modal-actions">
        <button class="modal-btn modal-btn-cancel">Cancel</button>
        <button class="modal-btn modal-btn-confirm">Create</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay;
}

function closeModal(modal) {
  modal.classList.remove('active');
  setTimeout(() => modal.remove(), 300);
}

/* ======================================================
   AUTO INIT
====================================================== */

initCustomSelects();
