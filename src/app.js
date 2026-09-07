import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/env.js';
import { initDB } from './config/db.js';
import { seedInitialData } from './utils/seed.js';
import requestLogger from './middleware/logger.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import studentsRoutes from './routes/studentsRoutes.js';
import admissionsRoutes from './routes/admissionsRoutes.js';
import careersRoutes from './routes/careersRoutes.js';
import reviewsRoutes from './routes/reviewsRoutes.js';
import nielitRoutes from './routes/nielitRoutes.js';
import eventsRoutes from './routes/eventsRoutes.js';
import coursesRoutes from './routes/coursesRoutes.js';
import internshipsRoutes from './routes/internshipsRoutes.js';
import certificatesRoutes from './routes/certificatesRoutes.js';
import feesRoutes from './routes/feesRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import projectsRoutes from './routes/projectsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy when running behind a reverse proxy/load balancer (useful in production)
app.set('trust proxy', true);

// Initialize DB & Seed Data
initDB();
seedInitialData();

// Security & Base Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' }
}));

// CORS configuration: use CORS_ORIGIN env (comma-separated) or '*' to allow all
const corsOriginRaw = (config.corsOrigin || '*').toString();
const corsWhitelist = (corsOriginRaw === '*' || !corsOriginRaw) ? null : corsOriginRaw.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // If wildcard or whitelist is not provided, allow the request
    if (!corsWhitelist) return callback(null, true);
    // Allow if origin is in whitelist or if it's a vercel app subdomain
    if (corsWhitelist.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // Reject other origins
    return callback(new Error('CORS: Origin not allowed by policy'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Rate Limiting (100 requests per 15 min window)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// Swagger API Documentation UI
try {
  const swaggerPath = path.join(__dirname, '../swagger.json');
  if (fs.existsSync(swaggerPath)) {
    const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }
} catch (e) {
  console.warn('Swagger UI initialization warning:', e.message);
}

// API Routes Mounting - Full IT HUNT Enterprise Suite
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/admissions', admissionsRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/nielit-projects', nielitRoutes);
app.use('/api/nielitProjects', nielitRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/internships', internshipsRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectsRoutes);

// Root Endpoint Redirect/Summary
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to IT HUNT Enterprise Backend REST API',
    organization: config.orgName,
    director: config.orgLead,
    documentation: '/api-docs',
    health: '/api/health',
    status: 'ACTIVE'
  });
});

// Fallback & Global Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
