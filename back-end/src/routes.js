import { buildRoutePath } from './utils/build-route-path.js';
import { Task } from './models/Task.js';
import { Schedule } from './models/Schedule.js';
import { taskSchema, updateTaskSchema, scheduleSchema } from './utils/validation-schemas.js';

export const routes = [
    // --- TASKS ---
    {
        method: 'GET',
        path: buildRoutePath('/tasks'),
        handler: async (req, res) => {
            const { search } = req.query ? req.query : {};
            
            const query = search ? {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            } : {};

            const tasks = await Task.find(query);
            return res.end(JSON.stringify(tasks));
        }
    },
    {
        method: 'POST',
        path: buildRoutePath('/tasks'),
        handler: async (req, res) => {
            const validation = taskSchema.safeParse(req.body);

            if (!validation.success) {
                return res.writeHead(400).end(JSON.stringify(validation.error.flatten()));
            }

            const { title, description, dueDate, priority, category } = validation.data;

            const task = await Task.create({
                title,
                description,
                dueDate,
                priority,
                category,
            });

            return res.writeHead(201).end(JSON.stringify(task));
        }
    },
    {
        method: 'PUT',
        path: buildRoutePath('/tasks/:id'),
        handler: async (req, res) => {
            const { id } = req.params;
            const validation = updateTaskSchema.safeParse(req.body);

            if (!validation.success) {
                return res.writeHead(400).end(JSON.stringify(validation.error.flatten()));
            }

            const { title, description, dueDate, priority, category } = validation.data;

            await Task.findByIdAndUpdate(id, {
                title,
                description,
                dueDate,
                priority,
                category,
            });

            return res.writeHead(204).end();
        }
    },
    {
        method: 'DELETE',
        path: buildRoutePath('/tasks/:id'),
        handler: async (req, res) => {
            const { id } = req.params;

            await Task.findByIdAndDelete(id);

            return res.writeHead(204).end();
        }
    },
    {
        method: 'PATCH',
        path: buildRoutePath('/tasks/:id/complete'),
        handler: async (req, res) => {
            const { id } = req.params;
            
            const task = await Task.findById(id);

            if (!task) {
                return res.writeHead(404).end();
            }

            task.completed = !task.completed;
            await task.save();

            return res.writeHead(204).end();
        }
    },
    
    // --- SCHEDULES ---
    {
        method: 'GET',
        path: buildRoutePath('/schedules'),
        handler: async (req, res) => {
            const schedules = await Schedule.find();
            return res.end(JSON.stringify(schedules));
        }
    },
    {
        method: 'POST',
        path: buildRoutePath('/schedules'),
        handler: async (req, res) => {
            const validation = scheduleSchema.safeParse(req.body);

            if (!validation.success) {
                return res.writeHead(400).end(JSON.stringify(validation.error.flatten()));
            }

            const { title, description, date, time } = validation.data;

            const schedule = await Schedule.create({
                title,
                description,
                date,
                time
            });

            return res.writeHead(201).end(JSON.stringify(schedule));
        }
    },
];

