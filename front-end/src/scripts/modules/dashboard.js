export function updateDashboard() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // 1. Basic Counts
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    updateText('total-tasks-count', totalTasks);
    updateText('pending-tasks-count', pendingTasks);
    updateText('completed-tasks-count', completedTasks);
    
    // Update Sidebar Badge
    updateText('pending-count-badge', pendingTasks);

    // 2. Completion Rate
    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    updateText('completion-rate', `${completionRate}%`);

    // 3. Overdue Tasks
    const today = new Date().setHours(0, 0, 0, 0);
    const overdueCount = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        // Avoid timezone issues by using string comparison for simple dates if possible, 
        // but setHours on Date object controls is safer if valid dates.
        const due = new Date(t.dueDate).setHours(0, 0, 0, 0);
        return due < today;
    }).length;
    updateText('overdue-count', overdueCount);

    // 4. Top Category
    const categories = {};
    tasks.forEach(t => {
        const cat = t.category || 'Uncategorized';
        categories[cat] = (categories[cat] || 0) + 1;
    });
    
    let topCatName = '-';
    let topCatCount = 0;
    Object.entries(categories).forEach(([name, count]) => {
        if (count > topCatCount) {
            topCatCount = count;
            topCatName = name;
        }
    });
    updateText('top-category', topCatName);

    // 5. Daily Streak
    const completionDates = new Set(tasks
        .filter(t => t.completed && t.completedAt)
        .map(t => new Date(t.completedAt).toDateString())
    );
    
    let streak = 0;
    let d = new Date();
    // Loop back 365 days max to prevent infinite
    for(let i=0; i<365; i++) {
        const dateStr = d.toDateString();
        // If today has no completion, don't break streak yet (user might do it later)
        // But if yesterday is missing, streak is 0 or ended.
        // Wait, efficient streak logic:
        // Case A: Today is marked. Streak = 1 + Yesterday's streak.
        // Case B: Today is NOT marked. Yesterday MUST be marked to have streak > 0.
        
        if (completionDates.has(dateStr)) {
            streak++;
        } else {
            // If it's today and empty, it's fine, continue to check yesterday.
            if (i === 0) {
                 // do nothing, check previous day
            } else {
                break; // Gap found
            }
        }
        d.setDate(d.getDate() - 1);
    }
    updateText('daily-streak', `${streak} days`);

    // 6. Category Chart Rendering
    renderCategoryChart(categories, totalTasks);
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function renderCategoryChart(categories, total) {
    const container = document.getElementById('category-chart');
    if (!container) return;
    container.innerHTML = '';

    if (total === 0) {
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted);">No data available</p>';
        return;
    }

    // Sort categories by count
    const sortedProps = Object.entries(categories).sort((a, b) => b[1] - a[1]);

    sortedProps.forEach(([name, count]) => {
        const percentage = Math.round((count / total) * 100);
        
        const row = document.createElement('div');
        row.className = 'category-row';
        row.innerHTML = `
            <div class="cat-info">
                <span class="cat-name">${name}</span>
                <span class="cat-pct">${percentage}%</span>
            </div>
            <div class="cat-bar-bg">
                <div class="cat-bar-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        container.appendChild(row);
    });
}
