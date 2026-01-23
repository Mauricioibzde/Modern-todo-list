import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from '../firebase-config.js';

class DatabaseService {
    constructor() {
        this.tasksCollection = collection(db, 'tasks');
        this.schedulesCollection = collection(db, 'schedules');
        this.categoriesCollection = collection(db, 'categories');
        
        // In-memory cache for synchronous access where needed (with limitations)
        // But ideally we switch to async. 
        // For 'ease of work', we will implement async methods.
    }

    // --- Tasks ---
    async getTasks() {
        const snapshot = await getDocs(this.tasksCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addTask(task) {
        // Remove ID if present, let Firebase generate it
        const { id, ...data } = task; 
        const docRef = await addDoc(this.tasksCollection, data);
        return { id: docRef.id, ...data };
    }

    async updateTask(id, updates) {
        const taskRef = doc(db, 'tasks', id);
        await updateDoc(taskRef, updates);
    }

    async deleteTask(id) {
        const taskRef = doc(db, 'tasks', id);
        await deleteDoc(taskRef);
    }

    // Subscribe to tasks (Real-time)
    onTasksSnapshot(callback) {
        return onSnapshot(this.tasksCollection, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(tasks);
        });
    }

    // --- Schedules ---
    async getSchedules() {
        const snapshot = await getDocs(this.schedulesCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addSchedule(schedule) {
        const { id, ...data } = schedule;
        const docRef = await addDoc(this.schedulesCollection, data);
        return { id: docRef.id, ...data };
    }

    async updateSchedule(id, updates) {
        const ref = doc(db, 'schedules', id);
        await updateDoc(ref, updates);
    }

    async deleteSchedule(id) {
        const ref = doc(db, 'schedules', id);
        await deleteDoc(ref);
    }

    onSchedulesSnapshot(callback) {
        return onSnapshot(this.schedulesCollection, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(items);
        });
    }

    // --- Categories ---
    // We can also sync categories.
    async getCategories(type) {
        // Implementation for categories if we move them to DB
        // For now, let's keep localStorage for user preferences or move them later if requested.
        // User asked for "implement firebase as database", usually implies domain data (tasks/schedules).
    }
}

export const dbService = new DatabaseService();
