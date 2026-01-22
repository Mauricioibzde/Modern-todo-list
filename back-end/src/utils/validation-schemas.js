import { z } from 'zod';

export const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    dueDate: z.string().min(1, 'Due date is required'),
    priority: z.enum(['high', 'medium', 'low']).default('medium'),
    category: z.string().default('general'),
});

export const scheduleSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    date: z.string().min(1, 'Date is required'),
    time: z.string().min(1, 'Time is required'),
});

export const updateTaskSchema = taskSchema.partial();
