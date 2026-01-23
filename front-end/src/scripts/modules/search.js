
import { showToast } from './notifications.js';
import { showConfirmModal } from './modals.js';
import { dbService } from '../services/db.js';

let tasks = [];
let schedules = [];

// State
const state = {
    term: '',
    type: 'all', // 'all', 'task', 'schedule'
    priority: 'all', // 'all', 'low', 'medium', 'high', 'extreme'
    category: 'all'
};

// Elements
const searchInput = document.getElementById('search-input');
const searchResultsUl = document.querySelector('.search-results-ul');
const categoryFilterOptionsContainer = document.querySelector('#filter-category-options');

// Icons
const taskIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>`;
const scheduleIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`;

export function initSearch() {
    loadData();
    setupEventListeners();
    populateCategoryFilter();

    // Listen for updates from other modules
    // document.addEventListener('tasksUpdated', refreshSearch);
    // document.addEventListener('schedulesUpdated', refreshSearch);
}

function refreshSearch() {
    // loadData(); // Data is loaded via snapshot
    populateCategoryFilter();
    // Only perform search if there is a term or filter is active, or just always update if the User is looking at the search screen?
    // If the user is on the search screen, we should update the results.
    // If we are just running in background, performSearch calls render which checks for elements.
    performSearch();
}

function loadData() {
    // tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    // schedules = JSON.parse(localStorage.getItem('schedules')) || [];
    
    dbService.onTasksSnapshot(data => {
        tasks = data;
        refreshSearch();
    });
    dbService.onSchedulesSnapshot(data => {
        schedules = data;
        refreshSearch();
    });
}

function setupEventListeners() {
    // 1. Search Input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.term = e.target.value.toLowerCase();
            performSearch();
        });
    }

    // 2. Custom Select Dropdowns
    setupCustomSelect('filter-type', (value) => {
        state.type = value;
        performSearch();
    });

    setupCustomSelect('filter-priority', (value) => {
        state.priority = value;
        performSearch();
    });

    setupCustomSelect('filter-category', (value) => {
        state.category = value;
        performSearch();
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-filter-select')) {
            closeAllDropdowns();
        }
    });

    // Listen for data updates (if implemented elsewhere via custom events)
    // We can also just reload on search trigger, but doing it on event is better
    // For now, we'll reload just before search in performSearch to ensure freshness? 
    // Or assume immutable per session unless notified.
    // Let's reload on input focus maybe? Or just keep it simple.
}

function setupCustomSelect(id, onSelect) {
    const container = document.getElementById(id);
    if (!container) return;

    const trigger = container.querySelector('.filter-select-trigger');
    const optionsContainer = container.querySelector('.filter-select-options');
    
    // Remove 'hidden' class if present, as it conflicts with our CSS transitions
    if (optionsContainer.classList.contains('hidden')) {
        optionsContainer.classList.remove('hidden');
    }

    const triggerSpan = trigger.querySelector('span');
    const options = container.querySelectorAll('.filter-option');

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = optionsContainer.classList.contains('show');
        closeAllDropdowns(); // Close others
        if (!isOpen) {
            optionsContainer.classList.add('show');
            trigger.classList.add('active');
        }
    });

    // Use event delegation for options if dynamic
    // But for static ones, we can bind directly. For dynamic categories, we re-bind or use delegation.
    // Let's use delegation on container
    container.addEventListener('click', (e) => {
        const option = e.target.closest('.filter-option');
        if (option) {
            e.stopPropagation();
            const value = option.dataset.value;
            const text = option.textContent;

            // Update UI
            triggerSpan.textContent = `${id.replace('filter-', '').charAt(0).toUpperCase() + id.replace('filter-', '').slice(1)}: ${value === 'all' ? 'All' : text}`;
            
            // Update Selected State
            container.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            // Close
            optionsContainer.classList.remove('show');
            trigger.classList.remove('active');

            // Callback
            if (onSelect) onSelect(value);
        }
    });
}

function closeAllDropdowns() {
    document.querySelectorAll('.filter-select-options').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.filter-select-trigger').forEach(el => el.classList.remove('active'));
}

function populateCategoryFilter() {
    if (!categoryFilterOptionsContainer) return;

    const categories = new Set();
    
    // 1. Get Categories from Definitions (ensure even empty categories are listed)
    const definedTaskCategories = JSON.parse(localStorage.getItem('customCategories')) || [];
    definedTaskCategories.forEach(c => categories.add(c.value));

    const definedScheduleCategories = JSON.parse(localStorage.getItem('scheduleCategories')) || [];
    definedScheduleCategories.forEach(c => categories.add(c.value));

    // 2. Get Task Categories (in case of legacy/deleted categories still in use)
    tasks.forEach(task => {
        if (task.category) categories.add(task.category);
    });

    // 3. Get Schedule Categories
    schedules.forEach(sch => {
        if (sch.category) categories.add(sch.category);
    });

    // Clear existing dynamic options (keep the first "All" option usually, but here we rebuild after "All")
    // "All" is hardcoded in HTML? Yes.
    // The HTML has "All Categories" hardcoded.
    // We want to keep that one.
    
    // Let's select all options and if they have value 'all', keep them, destroy others or just append
    // Simpler: clear all except first child?
    
    const allOption = categoryFilterOptionsContainer.querySelector('[data-value="all"]');
    categoryFilterOptionsContainer.innerHTML = '';
    if (allOption) categoryFilterOptionsContainer.appendChild(allOption);

    categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'filter-option';
        div.dataset.value = cat;
        // Try to find a nice label if available
        const taskDef = definedTaskCategories.find(c => c.value === cat);
        const schedDef = definedScheduleCategories.find(c => c.value === cat);
        const label = (taskDef && taskDef.label) || (schedDef && schedDef.label) || cat;
        
        // Capitalize first letter if it looks raw
        const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

        div.textContent = displayLabel;
        categoryFilterOptionsContainer.appendChild(div);
    });
}

function performSearch() {
    loadData(); // Ensure data is fresh
    
    // Normalize Items
    const normalizedTasks = tasks.map(t => ({
        ...t, 
        type: 'task', 
        dateDisplay: `Due: ${t.dueDate}`,
        priorityVal: getPriority(t.category, 'task')
    }));
    
    const normalizedSchedules = schedules.map(s => ({
        ...s, 
        type: 'schedule', 
        dateDisplay: `${s.date} at ${s.time}`,
        priorityVal: getPriority(s.category, 'schedule')
    }));

    let combined = [];
    if (state.type === 'all') {
        combined = [...normalizedTasks, ...normalizedSchedules];
    } else if (state.type === 'task') {
        combined = normalizedTasks;
    } else if (state.type === 'schedule') {
        combined = normalizedSchedules;
    }

    // Filters
    const filtered = combined.filter(item => {
        // 1. Term
        const matchesTerm = state.term === '' || 
                            item.title.toLowerCase().includes(state.term) || 
                            item.description.toLowerCase().includes(state.term);
        
        // 2. Category
        const matchesCategory = state.category === 'all' || item.category === state.category;

        // 3. Priority
        const matchesPriority = state.priority === 'all' || item.priorityVal === state.priority;

        return matchesTerm && matchesCategory && matchesPriority;
    });

    renderResults(filtered);
}

function getPriority(categoryName, type) {
    const key = type === 'task' ? 'customCategories' : 'scheduleCategories';
    const categories = JSON.parse(localStorage.getItem(key)) || [];
    const cat = categories.find(c => c.value === categoryName);
    return cat ? cat.priority : 'low'; // Default to low if not found
}

function renderResults(items) {
    if (!searchResultsUl) return;
    searchResultsUl.innerHTML = '';

    if (items.length === 0) {
        searchResultsUl.innerHTML = '<li class="no-tasks-found">No items found matching your criteria.</li>';
        return;
    }

    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'schedule-item'; // Reuse existing styles
        
        // Priority Dot
        let priorityHtml = '';
        if (item.priorityVal) {
            priorityHtml = `<span class="priority-dot ${item.priorityVal}" title="Priority: ${item.priorityVal}" style="margin-right: 8px; vertical-align: middle;"></span>`;
        }

        // Icon based on type
        const iconSvg = item.type === 'task' ? taskIcon : scheduleIcon;

        li.innerHTML = `
        <div class="task-header">
            <div class="status-task" style="color: var(--text-secondary);">
                  ${iconSvg}
            </div>
            <span class="name-task" style="display: flex; align-items: center;">${priorityHtml}${item.title}</span>
            <span class="date-task">${item.dateDisplay}</span>
        </div>
        <div class="description">
            <span>${item.description}</span>
            <div style="display:flex; justify-content:space-between; margin-top: 10px;">
                <p style="font-size: 0.8rem; color: #6b7280;">Category: ${item.category}</p>
                <span style="font-size: 0.7rem; padding: 2px 6px; background: var(--bg-secondary); border-radius: 4px;">${item.type.toUpperCase()}</span>
            </div>
        </div>
        <div class="controls">
             <!-- Controls could be added but might be complex for search view -->
             <!-- Maybe just a jump to link or Delete -->
        </div>
        `;

        // Add delete logic? 
        // For now, just View.
        
        // Interaction
        li.addEventListener('click', () => {
             const desc = li.querySelector('.description');
             desc.classList.toggle('expanded');
        });

        searchResultsUl.appendChild(li);
    });
}
