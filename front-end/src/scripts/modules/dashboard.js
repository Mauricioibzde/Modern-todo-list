// Dashboard is stateless: receives tasks externally
// Memoization prevents unnecessary DOM updates

let lastTasksHash = '';

/* ======================================================
   PUBLIC API
====================================================== */

export function updateDashboard(tasks) {
  if (!Array.isArray(tasks)) return;

  // Simple memoization based on relevant task fields
  const hash = createTasksHash(tasks);
  if (hash === lastTasksHash) return;
  lastTasksHash = hash;

  // Pre-calculated metrics
  const stats = calculateStats(tasks);

  // Render sections
  renderCounts(stats);
  renderCompletionRate(stats);
  renderOverdue(stats);
  renderTopCategory(stats);
  renderStreak(stats);
  renderCategoryChart(stats.categories, stats.totalTasks);
}

/* ======================================================
   HASHING (MEMOIZATION)
====================================================== */

function createTasksHash(tasks) {
  return JSON.stringify(
    tasks.map(t => ({
      id: t.id,
      completed: t.completed,
      dueDate: t.dueDate,
      category: t.category,
      completedAt: t.completedAt
    }))
  );
}

/* ======================================================
   CALCULATIONS
====================================================== */

function calculateStats(tasks) {
  const today = startOfDay(new Date());

  let completedTasks = 0;
  let overdueTasks = 0;
  const categories = {};
  const completionDates = new Set();

  tasks.forEach(task => {
    // Completion
    if (task.completed) {
      completedTasks++;
      if (task.completedAt) {
        completionDates.add(new Date(task.completedAt).toDateString());
      }
    }

    // Overdue
    if (!task.completed && task.dueDate) {
      const due = startOfDay(new Date(task.dueDate));
      if (due < today) overdueTasks++;
    }

    // Categories
    const cat = task.category || 'Uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  const totalTasks = tasks.length;
  const pendingTasks = totalTasks - completedTasks;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    categories,
    completionRate: totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0,
    dailyStreak: calculateStreak(completionDates)
  };
}

/* ======================================================
   STREAK LOGIC
====================================================== */

function calculateStreak(completionDates) {
  let streak = 0;
  const date = new Date();

  for (let i = 0; i < 365; i++) {
    const dateStr = date.toDateString();

    if (completionDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }

    date.setDate(date.getDate() - 1);
  }

  return streak;
}

/* ======================================================
   RENDERING — SMALL & FOCUSED
====================================================== */

function renderCounts({ totalTasks, pendingTasks, completedTasks }) {
  updateText('total-tasks-count', totalTasks);
  updateText('pending-tasks-count', pendingTasks);
  updateText('completed-tasks-count', completedTasks);
  updateText('pending-count-badge', pendingTasks);
}

function renderCompletionRate({ completionRate }) {
  updateText('completion-rate', `${completionRate}%`);
}

function renderOverdue({ overdueTasks }) {
  updateText('overdue-count', overdueTasks);
}

function renderTopCategory({ categories }) {
  let topName = '-';
  let topCount = 0;

  Object.entries(categories).forEach(([name, count]) => {
    if (count > topCount) {
      topCount = count;
      topName = name;
    }
  });

  updateText('top-category', topName);
}

function renderStreak({ dailyStreak }) {
  updateText('daily-streak', `${dailyStreak} days`);
}

/* ======================================================
   CATEGORY CHART
====================================================== */

function renderCategoryChart(categories, total) {
  const container = document.getElementById('category-chart');
  if (!container) return;

  container.innerHTML = '';

  if (!total) {
    container.innerHTML = `
      <p style="text-align:center; color: var(--text-muted);">
        No data available
      </p>
    `;
    return;
  }

  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      const percentage = Math.round((count / total) * 100);

      const row = document.createElement('div');
      row.className = 'category-row';
      row.innerHTML = `
        <div class="cat-info">
          <span class="cat-name">${name}</span>
          <span class="cat-pct">${percentage}%</span>
        </div>
        <div class="cat-bar-bg">
          <div class="cat-bar-fill" style="width:${percentage}%"></div>
        </div>
      `;

      container.appendChild(row);
    });
}

/* ======================================================
   HELPERS
====================================================== */

function updateText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function startOfDay(date) {
  return new Date(date.setHours(0, 0, 0, 0));
}
