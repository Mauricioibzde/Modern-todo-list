import { updateDashboard } from './dashboard.js';

const form = document.querySelector('.add-task');
const titleInput = document.querySelector('#title');
const descriptionInput = document.querySelector('#description');
const dateInput = document.querySelector('#due-date');
const taskListUl = document.querySelector('.list-tasks .list-tasks-ul'); // Specific selector to avoid conflict
const noTasksMessage = document.querySelector('.no-tasks-message');
const searchInput = document.querySelector('#search-input');
const searchResultsUl = document.querySelector('.search-results-ul');
let currentSearchCategory = 'all';

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'pending'; // 'all', 'pending'

// Initialize
// We need re-render based on local storage
renderTasks();
checkEmptyState();
updateDashboard();
generateSearchFilters(); // Generate filters on load

// Save to LocalStorage helper
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateDashboard();
    generateSearchFilters(); // Regenerate filters when tasks change
}

// Event listener for navigation filters
document.addEventListener('filterTasks', (e) => {
    currentFilter = e.detail.filter;
    renderTasks();
    
    // Update header title based on filter
    const listHeader = document.querySelector('.list-tasks h1');
    if (listHeader) {
        listHeader.textContent = currentFilter === 'all' ? 'All Tasks' : 'Pending Tasks';
    }
});

// Event listener for Search
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        renderSearch(searchInput.value.toLowerCase());
    });
}

function generateSearchFilters() {
    const filtersContainer = document.getElementById('search-filters');
    if (!filtersContainer) return;

    // Get unique categories
    const categories = new Set(['all']);
    tasks.forEach(task => {
        if (task.category) categories.add(task.category);
    });

    filtersContainer.innerHTML = '';
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-chip ${currentSearchCategory === cat ? 'active' : ''}`;
        btn.textContent = cat === 'all' ? 'All' : cat;
        btn.dataset.filter = cat;
        
        btn.addEventListener('click', () => {
            // Remove active class from all
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            // Add to current
            btn.classList.add('active');
            currentSearchCategory = cat;
            // Trigger search with current term
            if (searchInput) renderSearch(searchInput.value.toLowerCase());
        });
        
        filtersContainer.appendChild(btn);
    });
}

function renderSearch(term) {
    if (!searchResultsUl) return;
    searchResultsUl.innerHTML = '';
    
    const filtered = tasks.filter(task => {
        const matchesTerm = task.title.toLowerCase().includes(term) || 
                            task.description.toLowerCase().includes(term);
        const matchesCategory = currentSearchCategory === 'all' || task.category === currentSearchCategory;
        
        return matchesTerm && matchesCategory;
    });

    if (filtered.length === 0) {
        searchResultsUl.innerHTML = '<li class="no-tasks-found">No tasks found.</li>';
        return;
    }

    filtered.forEach(task => {
        const li = createTaskElement(task);
        searchResultsUl.appendChild(li);
    });
}

form.addEventListener('submit', function(event) {
    event.preventDefault();

    // Select the category input which is dynamically created
    const categoryInput = document.querySelector('#category');

    const newTask = {
        id: Date.now(), // Unique ID for finding/deleting
        createdAt: new Date().toISOString(),
        completedAt: null,
        title: titleInput.value,
        description: descriptionInput.value,
        dueDate: dateInput.value,
        category: categoryInput ? categoryInput.value : 'Uncategorized',
        completed: false
    };

    tasks.push(newTask); 
    saveTasks();
    console.log('Task Added:', newTask);

    // Only render if it matches current filter (e.g. if we are in "Pending" or "All")
    // But typically we switch view or just update. 
    // If we are adding, we probably want to see feedback, but let's just re-render list.
    renderTasks();
    checkEmptyState();
    alert("Task Created Successfully!"); // Feedback for user
    
    form.reset();
    
    // Reset the visual custom select
    const selectedDiv = document.querySelector('.select-selected');
    if (selectedDiv) {
        selectedDiv.textContent = 'Select Category';
        // Also clear the hidden input value
        if (categoryInput) categoryInput.value = '';
    }
});


function renderTasks() {
    if (!taskListUl) return;
    taskListUl.innerHTML = '';
    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'pending') return !task.completed;
        return true; 
    });

    filteredTasks.forEach(task => {
        const li = createTaskElement(task);
        taskListUl.appendChild(li);
    });
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.classList.toggle('completed', task.completed);
    
    li.innerHTML = `
        <div class="task-header">
            <input class="input-checkbox" type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="name-task">${task.title}</span>
            <span class="date-task">Due: ${task.dueDate}</span>
        </div>
        <div class="description">
            <span>${task.description}</span>
            <p style="margin-top: 10px; font-size: 0.8rem; color: #6b7280;">Category: ${task.category}</p>
        </div>
        <div class="controls">
            <!-- <button class="edit-button">Edit</button> -->
            <button class="delete-button">Delete</button>
        </div>
    `;

    // Interaction Logic
    li.addEventListener('click', (e) => {
        if (e.target.type === 'checkbox' || e.target.tagName === 'BUTTON') return;
        const taskDescription = li.querySelector('.description');
        const controls = li.querySelector('.controls');
        taskDescription.classList.toggle('expanded');
        controls.classList.toggle('expanded');
        li.classList.toggle('focused');
    });

    // Checkbox Logic
    li.querySelector('.input-checkbox').addEventListener('change', (e) => {
        e.stopPropagation();
        task.completed = e.target.checked;
        
        // Update timestamp for insights
        if (task.completed) {
            task.completedAt = new Date().toISOString();
        } else {
            task.completedAt = null;
        }

        saveTasks();
        li.classList.toggle('completed', task.completed);
        
        // If we in "pending" view, removing a completed task might be desired or just fade it.
        // For now, let's keep it until refresh or filter change, OR re-render immediately.
        // Re-rendering immediately feels snappy.
        if (currentFilter === 'pending' && task.completed) {
            renderTasks();
        }
    });

    // Delete Logic
    const deleteBtn = li.querySelector('.delete-button');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if(confirm('Delete this task?')) {
                tasks = tasks.filter(t => t.id !== task.id);
                saveTasks();
                renderTasks();
                checkEmptyState();
                // Also update search view if active
                if (searchInput && searchInput.value) renderSearch(searchInput.value);
            }
        });
    }

    // Edit Logic (Simple Prompt for now)
    /* 
    const editBtn = li.querySelector('.edit-button');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const newTitle = prompt("Edit Title:", task.title);
            if (newTitle) {
                task.title = newTitle;
                saveTasks();
                renderTasks();
            }
        });
    } 
    */

    return li;
}

// Replaced renderTask with renderTasks (plural) and helper createTaskElement
// Function renderTask(task) { ... } is removed in favor of full list rendering for consistency with persistence

function checkEmptyState() {
    if (!noTasksMessage) return;
    // Check against total tasks, or filtered? Usually total tasks determines "No tasks added yet".
    if (tasks.length === 0) {
        noTasksMessage.classList.add('active');
    } else {
        noTasksMessage.classList.remove('active');
    }
}

