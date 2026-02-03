// store.js
import { dbService } from './services/db.js';

class Store extends EventTarget {
    constructor() {
        super();
        this.state = {
            tasks: [],
            schedules: [],
            tasksLoading: true,
            schedulesLoading: true
        };
        
        this.init();
    }

    init() {
        // Subscribe to DB changes
        dbService.onTasksSnapshot((tasks) => {
            this.state.tasks = tasks;
            this.state.tasksLoading = false;
            
            // Store event
            this.dispatchEvent(new CustomEvent('tasksUpdated', { detail: this.state.tasks }));
            // Global backward compatibility event
            document.dispatchEvent(new CustomEvent('tasksUpdated', { detail: this.state.tasks }));
            
            this.dispatchEvent(new CustomEvent('stateChanged', { detail: this.state }));
        });

        dbService.onSchedulesSnapshot((schedules) => {
            this.state.schedules = schedules;
            this.state.schedulesLoading = false;

            // Store event
            this.dispatchEvent(new CustomEvent('schedulesUpdated', { detail: this.state.schedules }));
             // Global backward compatibility event
            document.dispatchEvent(new CustomEvent('schedulesUpdated', { detail: this.state.schedules }));

            this.dispatchEvent(new CustomEvent('stateChanged', { detail: this.state }));
        });
    }

    getTasks() {
        return this.state.tasks;
    }

    getSchedules() {
        return this.state.schedules;
    }
    
    // Optimistic Update Helper
    // We can call this before the DB confirms.
    optimisticAddTask(task) {
        const tempTask = { ...task, id: 'temp-' + Date.now(), isTemp: true };
        this.state.tasks = [tempTask, ...this.state.tasks];
        this.dispatchEvent(new CustomEvent('tasksUpdated', { detail: this.state.tasks }));
    }
}

export const store = new Store();
