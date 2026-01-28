import { dbService } from '../services/db.js';
import { updateBadge, showNotificationModal, showToast } from './alerts.js';

/* ======================================================
   CONFIG
====================================================== */

const REMINDER_CONFIG = {
  DAYS_AHEAD: 3,
  CHECK_INTERVAL: 30 * 60 * 1000 // 30 minutes
};

/* ======================================================
   STATE (LOCAL CACHE)
====================================================== */

let tasksCache = [];
let schedulesCache = [];
let expiringItems = [];

let reminderIntervalId = null;

/* ======================================================
   INIT
====================================================== */

export function initReminders() {
  setupAlertButton();
  subscribeToData();
  startInterval();
}

/* ======================================================
   UI SETUP
====================================================== */

function setupAlertButton() {
  const btn = document.getElementById('alert-btn');
  if (!btn) return;

  // Prevent duplicate listeners
  const freshBtn = btn.cloneNode(true);
  btn.replaceWith(freshBtn);

  freshBtn.addEventListener('click', () => {
    showNotificationModal(expiringItems);
  });
}

/* ======================================================
   DATA SUBSCRIPTIONS
====================================================== */

function subscribeToData() {
  dbService.onTasksSnapshot(tasks => {
    tasksCache = tasks;
    runReminderCheck(true);
  });

  dbService.onSchedulesSnapshot(schedules => {
    schedulesCache = schedules;
    runReminderCheck(true);
  });
}

/* ======================================================
   INTERVAL HANDLING
====================================================== */

function startInterval() {
  if (reminderIntervalId) clearInterval(reminderIntervalId);
  reminderIntervalId = setInterval(
    () => runReminderCheck(false),
    REMINDER_CONFIG.CHECK_INTERVAL
  );
}

/* ======================================================
   CORE LOGIC
====================================================== */

function runReminderCheck(shouldNotify) {
  const now = new Date();

  expiringItems = [
    ...getExpiringTasks(tasksCache, now),
    ...getExpiringSchedules(schedulesCache, now)
  ];

  updateBadge(expiringItems.length);

  if (shouldNotify && expiringItems.length > 0) {
    notifyUpcoming(expiringItems);
  }
}

/* ======================================================
   TASK CHECKING
====================================================== */

function getExpiringTasks(tasks, now) {
  const todayStart = startOfDay(now);
  const limit = endOfDay(addDays(now, REMINDER_CONFIG.DAYS_AHEAD));

  return tasks
    .filter(t => !t.completed && t.dueDate)
    .map(t => ({
      task: t,
      due: new Date(`${t.dueDate}T00:00:00`)
    }))
    .filter(({ due }) => due >= todayStart && due <= limit)
    .map(({ task }) => ({
      type: 'task',
      title: task.title,
      date: task.dueDate,
      description: task.description,
      original: task
    }));
}

/* ======================================================
   SCHEDULE CHECKING
====================================================== */

function getExpiringSchedules(schedules, now) {
  const limit = addDays(now, REMINDER_CONFIG.DAYS_AHEAD);

  return schedules
    .filter(s => !s.completed && s.date && s.time)
    .map(s => ({
      schedule: s,
      dateTime: new Date(`${s.date}T${s.time}:00`)
    }))
    .filter(({ dateTime }) =>
      !isNaN(dateTime) && dateTime >= now && dateTime <= limit
    )
    .map(({ schedule }) => ({
      type: 'schedule',
      title: schedule.title,
      date: `${schedule.date} ${schedule.time}`,
      description: schedule.description,
      original: schedule
    }));
}

/* ======================================================
   NOTIFICATION
====================================================== */

function notifyUpcoming(items) {
  const counts = items.reduce(
    (acc, item) => {
      acc[item.type]++;
      return acc;
    },
    { task: 0, schedule: 0 }
  );




  // Sempre mostra ambos os números, mesmo que um deles seja zero
  const message = `<div class="toast-counts-row"><span class="toast-task-count">${counts.task} task${counts.task === 1 ? '' : 's'}</span><span class="toast-schedule-count">${counts.schedule} schedule${counts.schedule === 1 ? '' : 's'}</span></div>due within ${REMINDER_CONFIG.DAYS_AHEAD} days.`;

  // Evita múltiplos toasts em sequência (mesmo mudando a contagem)
  if (notifyUpcoming.toastActive) return;
  notifyUpcoming.toastActive = true;
  showToast(message, 'warning', 'Upcoming Deadlines');
  // Esta linha desativa o bloqueio e permite que novas notificações apareçam após 2,5s
  setTimeout(() => { notifyUpcoming.toastActive = false; }, 2500);
}

/* ======================================================
   DATE HELPERS
====================================================== */

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
