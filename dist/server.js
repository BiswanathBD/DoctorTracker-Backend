import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { validateEnv } from './config/envValidator.js';
import { connectDB, disconnectDB } from './config/db.js';
import { sendResponse } from './utils/sendResponse.js';
import { ApiError } from './utils/ApiError.js';
import { AuthRoutes } from './modules/auth/auth.route.js';
// load and validate env
dotenv.config();
validateEnv();
const app = express();
const PORT = process.env.PORT || 5000;
// global middlewares
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
// root welcome route
app.get('/', (req, res) => {
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'welcome to doctor tracker api',
        data: {
            documentation: '/api/health',
            version: '1.0.0',
        },
    });
});
// health check
app.get('/api/health', (req, res) => {
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'doctor tracker api is running',
        data: {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
        },
    });
});
// api routes
app.use('/api/auth', AuthRoutes);
// 404 handler
app.use((req, res, next) => {
    next(new ApiError(404, `route ${req.method} ${req.originalUrl} not found`));
});
// global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'internal server error';
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});
let server;
// start server after db connection
const startServer = async () => {
    try {
        // connect database
        await connectDB();
        server = app.listen(PORT, () => {
            console.log(`server is running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('error starting server:', error);
        process.exit(1);
    }
};
startServer();
// graceful shutdown handler
const handleExit = async (signal) => {
    console.log(`${signal} received. closing server...`);
    if (server) {
        server.close(async () => {
            await disconnectDB();
            console.log('server closed successfully');
            process.exit(0);
        });
    }
    else {
        await disconnectDB();
        process.exit(0);
    }
};
// handle unhandled promise rejections
process.on('unhandledRejection', async (err) => {
    console.error('unhandled rejection detected:', err);
    if (server) {
        server.close(async () => {
            await disconnectDB();
            process.exit(1);
        });
    }
    else {
        await disconnectDB();
        process.exit(1);
    }
});
// handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('uncaught exception detected:', err);
    process.exit(1);
});
// handle termination signals
process.on('SIGTERM', () => handleExit('sigterm'));
process.on('SIGINT', () => handleExit('sigint'));
