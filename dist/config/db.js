import mongoose from 'mongoose';
// connect to mongodb
export const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('mongodb uri is not defined in environment variables');
        }
        // connection events
        mongoose.connection.on('connected', () => {
            console.log('mongodb connected successfully');
        });
        mongoose.connection.on('error', (err) => {
            console.error('mongodb connection error:', err);
        });
        mongoose.connection.on('disconnected', () => {
            console.warn('mongodb disconnected');
        });
        await mongoose.connect(uri);
    }
    catch (error) {
        console.error('failed to connect to mongodb:', error);
        process.exit(1);
    }
};
// disconnect mongodb on server shutdown
export const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log('mongodb disconnected cleanly');
    }
    catch (error) {
        console.error('error while disconnecting mongodb:', error);
    }
};
