import mongoose from 'mongoose';

export async function connectDatabase() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Connected to MongoDB Atlas');
    } catch (error) {
        console.error('Database connection error:', error);
    }
}