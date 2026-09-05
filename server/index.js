import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { initializeDatabase } from './database/initDb.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    if (config.security.corsOrigins.includes('*') || config.security.corsOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
app.use('/api/', apiRateLimiter);

// Serve static uploads
const uploadsPath = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// API Router
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

// Start Server & Initialize Database
const PORT = config.port || 3000;

async function startServer() {
  await initializeDatabase();

  app.listen(PORT, () => {
    logger.info(`============================================================`);
    logger.info(`LigiMed Backend Server active on port ${PORT}`);
    logger.info(`Environment: ${config.env}`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
    logger.info(`============================================================`);
  });
}

startServer().catch(err => {
  logger.error(`Fatal server failure on startup: ${err.message}`, { stack: err.stack });
});

export default app;
