import { showToast } from './alerts.js';
import { dbService } from '../services/db.js';

/* ======================================================
   DOM REFERENCES
====================================================== */

const form = document.querySelector('.add-schedule');
const titleInput = document.querySelector('#schedule-title');
const descriptionInput = document.querySelector('#schedule-description');
const dateInput = document.querySelector('#schedule-date');
const timeInput = document.querySelector('#schedule-time');

/* ======================================================
   INIT
====================================================== */

if (form) {
  form.addEventListener('submit', handleSubmit);
}

/* ======================================================
   SUBMIT HANDLER
====================================================== */

function handleSubmit(e) {
  e.preventDefault();

  const categoryInput = document.querySelector('#schedule-category');

  const formData = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    date: dateInput.value,
    time: timeInput.value,
    category: categoryInput?.value || 'Uncategorized'
  };

  const errors = validateSchedule(formData);
  if (errors.length) {
    showToast(
      `Please fix the following errors:\n- ${errors.join('\n- ')}`,
      'error'
    );
    return;
  }

  const newSchedule = buildSchedule(formData);

  dbService
    .addSchedule(newSchedule)
    .then(() => {
      showToast('Schedule Created Successfully!', 'success');
      resetForm(categoryInput);
    })
    .catch(err => {
      console.error(err);
      showToast('Failed to create schedule', 'error');
    });
}

/* ======================================================
   VALIDATION
====================================================== */

function validateSchedule({ title, date, time }) {
  const errors = [];

  if (!title) errors.push('Title is required.');
  else if (title.length < 3)
    errors.push('Title must be at least 3 characters long.');

  if (!date) errors.push('Date is required.');
  if (!time) errors.push('Time is required.');

  return errors;
}

/* ======================================================
   BUILD DATA
====================================================== */

function buildSchedule(data) {
  return {
    ...data,
    createdAt: new Date().toISOString(),
    completed: false
  };
}

/* ======================================================
   UI RESET
====================================================== */

function resetForm(categoryInput) {
  form.reset();
  resetDatePicker();
  resetTimePicker();
  resetCategorySelect(categoryInput);
}

function resetDatePicker() {
  const triggerText =
    document.querySelector('#date-picker-trigger-schedule .text');

  if (triggerText) {
    triggerText.textContent = 'Select a date';
  }
}

function resetTimePicker() {
  const trigger =
    document.querySelector('#time-picker-trigger-schedule');
  const triggerText = trigger?.querySelector('.text');

  if (triggerText) {
    triggerText.textContent = '00:00';
  }

  trigger?.classList.remove('has-value');
}

function resetCategorySelect(categoryInput) {
  if (!categoryInput) return;

  categoryInput.value = '';

  const wrapper = categoryInput.parentNode;
  wrapper
    ?.querySelector('.select-selected')
    ?.replaceChildren(document.createTextNode('Select Category'));

  wrapper
    ?.querySelectorAll('.same-as-selected')
    .forEach(el => el.classList.remove('same-as-selected'));
}
