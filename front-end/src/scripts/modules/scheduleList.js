
const scheduleListUl = document.querySelector('.list-schedules-ul');
const noSchedulesMessage = document.querySelector('.no-schedules-message');

let schedules = JSON.parse(localStorage.getItem('schedules')) || [];

export function initScheduleList() {
    renderSchedules();
    checkEmptyState();
    
    // Listen for updates from other modules
    document.addEventListener('schedulesUpdated', () => {
        reloadSchedules();
    });
}

function reloadSchedules() {
    schedules = JSON.parse(localStorage.getItem('schedules')) || [];
    renderSchedules();
    checkEmptyState();
}

function renderSchedules() {
    if (!scheduleListUl) return;
    scheduleListUl.innerHTML = '';
    
    schedules.forEach(schedule => {
        const li = createScheduleElement(schedule);
        scheduleListUl.appendChild(li);
    });
}

function createScheduleElement(schedule) {


    const li = document.createElement('li');
    // Schedules might not have "completed" state like tasks, or maybe they do?
    // scheduleForm.js sets completed: false.
    li.classList.toggle('completed', schedule.completed);
    li.classList.add('schedule-item');
    
    li.innerHTML = `
        <div class="task-header">
         <div class="status-schedule">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
</svg>

         </div>
            <input class="input-checkbox" type="checkbox" ${schedule.completed ? 'checked' : ''}>
            <span class="name-task">${schedule.title}</span>
            <span class="date-task">${schedule.date} at ${schedule.time}</span>
        </div>
        <div class="description">
            <span>${schedule.description}</span>
        </div>
        <div class="controls">
            <button class="delete-button">Delete</button>
        </div>
    `;

    // Interaction Logic (Expand/Collapse)
    li.addEventListener('click', (e) => {
        if (e.target.type === 'checkbox' || e.target.tagName === 'BUTTON') return;
        const description = li.querySelector('.description');
        const controls = li.querySelector('.controls');
        description.classList.toggle('expanded');
        controls.classList.toggle('expanded');
        li.classList.toggle('focused');
        li.querySelector('.status-schedule').classList.toggle('active');
        

    });

    // Checkbox Logic (Toggle Completion)
    li.querySelector('.input-checkbox').addEventListener('change', (e) => {
        e.stopPropagation();
        schedule.completed = e.target.checked;
        saveSchedules();
        li.classList.toggle('completed', schedule.completed);
        
        // Optionally move to bottom or style differently
    });

    // Delete Logic
    const deleteBtn = li.querySelector('.delete-button');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if(confirm('Delete this schedule?')) {
                schedules = schedules.filter(s => s.id !== schedule.id);
                saveSchedules();
                renderSchedules();
                checkEmptyState();
            }
        });
    }

    return li;
}

function saveSchedules() {
    localStorage.setItem('schedules', JSON.stringify(schedules));
    // Dispatch event so other parts (like Dashboard if we add it later) know
    document.dispatchEvent(new CustomEvent('schedulesUpdated'));
}

function checkEmptyState() {
    if (!noSchedulesMessage) return;
    if (schedules.length === 0) {
        noSchedulesMessage.classList.add('active');
    } else {
        noSchedulesMessage.classList.remove('active');
    }
}
