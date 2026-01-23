import { showToast } from './notifications.js';
import { dbService } from '../services/db.js';

let currentExpiringItems = [];

export function initReminders() {
    const alertBtn = document.getElementById('alert-btn');
    if (alertBtn) {
        alertBtn.addEventListener('click', showNotificationModal);
    }
    
    // Listen for data updates to re-check immediately
    document.addEventListener('tasksUpdated', () => checkReminders(true));
    document.addEventListener('schedulesUpdated', () => checkReminders(true));

    // Run immediately on load (wait for DB sync though? initListeners does initial fetch)
    // We can rely on the events above to trigger the first check.
    // But keeps the interval for time-passing updates.
    setInterval(() => checkReminders(false), 30 * 60 * 1000); // 30 mins
}

function checkReminders(shouldNotify = false) {
    console.log('Checking reminders...');
    const now = new Date();
    currentExpiringItems = [];

    // Define the window: from NOW until NOW + 3 Days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Get Data from Service
    const tasks = dbService.getTasksSync();
    const schedules = dbService.getSchedulesSync();

    // Check Tasks
    tasks.forEach(task => {
        if (task.completed) return; // Ignore completed
        if (!task.dueDate) return;

        const taskDate = new Date(task.dueDate + 'T00:00:00'); // Local time
        const todayMidnight = new Date();
        todayMidnight.setHours(0,0,0,0);
        
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + 3);
        limitDate.setHours(23,59,59,999);

        if (taskDate >= todayMidnight && taskDate <= limitDate) {
            currentExpiringItems.push({
                type: 'task',
                title: task.title,
                date: task.dueDate, // YYYY-MM-DD
                description: task.description,
                original: task
            });
        }
    });

    // Check Schedules
    schedules.forEach(schedule => {
        if (schedule.completed) return;
        if (!schedule.date || !schedule.time) return;

        const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}:00`);
        
        if (isNaN(scheduleDateTime.getTime())) return;

        if (scheduleDateTime >= now && scheduleDateTime <= threeDaysFromNow) {
            currentExpiringItems.push({
                type: 'schedule',
                title: schedule.title,
                date: `${schedule.date} ${schedule.time}`,
                description: schedule.description,
                original: schedule
            });
        }
    });

    updateBadge(currentExpiringItems.length);

    // Notification Logic (Toast)
    if (shouldNotify && currentExpiringItems.length > 0) {
        const tasksCount = currentExpiringItems.filter(i => i.type === 'task').length;
        const schedulesCount = currentExpiringItems.filter(i => i.type === 'schedule').length;

        let msg = "Reminder: ";
        const parts = [];
        
        if (tasksCount > 0) {
            parts.push(`${tasksCount} task${tasksCount === 1 ? '' : 's'} due soon`);
        }
        if (schedulesCount > 0) {
            parts.push(`${schedulesCount} schedule${schedulesCount === 1 ? '' : 's'} coming up`);
        }
        
        msg += parts.join(' and ') + " within 3 days.";
        
        showToast(msg, 'warning', 'Upcoming Deadlines');
    }
}

function updateBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return;

    badge.textContent = count > 99 ? '99+' : count;
    
    if (count > 0) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function showNotificationModal() {
    // If no items, maybe show toast saying "No upcoming deadlines"?
    if (currentExpiringItems.length === 0) {
        showToast("No upcoming deadlines in the next 3 days.", 'info');
        return;
    }

    // Check if modal already exists
    let modalOverlay = document.getElementById('notification-list-modal');
    if (modalOverlay) modalOverlay.remove(); // Re-create to ensure fresh state

    modalOverlay = document.createElement('div');
    modalOverlay.id = 'notification-list-modal';
    modalOverlay.className = 'modal-overlay active';
    
    // Sort items by date (approximated string comparison works for ISO, but we might have mixed formats)
    // Task: YYYY-MM-DD, Schedule: YYYY-MM-DD HH:MM
    // Basic sort:
    currentExpiringItems.sort((a, b) => a.date.localeCompare(b.date));

    // Generate List HTML
    const listHtml = currentExpiringItems.map(item => `
        <li class="notification-item">
            <div class="notification-item-header">
                <span class="notification-item-title">${escapeHtml(item.title)}</span>
                <span class="notification-item-tag ${item.type}">${item.type}</span>
            </div>
            ${item.description ? `<div class="notification-item-info">${escapeHtml(item.description)}</div>` : ''}
            <div class="notification-item-due">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:14px;height:14px;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Due: ${item.date}
            </div>
        </li>
    `).join('');

    modalOverlay.innerHTML = `
        <div class="modal-content">
            <h3 class="modal-title" style="display:flex;align-items:center;gap:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px;height:24px;color:var(--color-warning);">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                Upcoming Deadlines
            </h3>
            <ul class="notification-list">
                ${listHtml}
            </ul>
            <div class="modal-actions">
                <button class="modal-btn modal-btn-confirm" id="close-notifications-btn">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Events
    const closeBtn = modalOverlay.querySelector('#close-notifications-btn');
    const close = () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => modalOverlay.remove(), 300);
    };

    closeBtn.onclick = close;
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) close();
    };
}

function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
