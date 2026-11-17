import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { type Server } from 'http';
import { validateEnv } from './config/envValidator.js';
import { connectDB, disconnectDB } from './config/db.js';
import { sendResponse } from './utils/sendResponse.js';
import { ApiError } from './utils/ApiError.js';
import { AuthRoutes } from './modules/auth/auth.route.js';
import { DoctorRoutes } from './modules/doctor/doctor.route.js';
import { PatientRoutes } from './modules/patient/patient.route.js';
import { DashboardRoutes } from './modules/dashboard/dashboard.route.js';

// load and validate env
dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

// global middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('not allowed by cors'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan('dev'));

// root welcome route
app.get('/', (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'welcome to doctor tracker api',
    data: {
      documentation: '/',
      version: '1.0.0',
    },
  });
});

// api routes
app.use('/api/auth', AuthRoutes);
app.use('/api/doctors', DoctorRoutes);
app.use('/api/patients', PatientRoutes);
app.use('/api/dashboard', DashboardRoutes);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `route ${req.method} ${req.originalUrl} not found`));
});

// global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'internal server error';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

let server: Server;

// start server after db connection
const startServer = async () => {
  try {
    // connect database
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('error starting server:', error);
    process.exit(1);
  }
};

startServer();

// graceful shutdown handler
const handleExit = async (signal: string) => {
  console.log(`${signal} received. closing server...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      console.log('server closed successfully');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

// handle unhandled promise rejections
process.on('unhandledRejection', async (err: any) => {
  console.error('unhandled rejection detected:', err);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(1);
    });
  } else {
    await disconnectDB();
    process.exit(1);
  }
});

// handle uncaught exceptions
process.on('uncaughtException', (err: any) => {
  console.error('uncaught exception detected:', err);
  process.exit(1);
});

// handle termination signals
process.on('SIGTERM', () => handleExit('sigterm'));
process.on('SIGINT', () => handleExit('sigint'));
