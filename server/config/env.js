import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'ligimed',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10)
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key-ligimed',
    expire: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key-ligimed',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d'
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || ''
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173').split(',')
  },

  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    bucket: process.env.STORAGE_BUCKET || 'ligimed-files',
    key: process.env.STORAGE_KEY || 'mock',
    secret: process.env.STORAGE_SECRET || 'mock'
  },

  kyc: {
    provider: process.env.KYC_PROVIDER || 'sandbox',
    baseUrl: process.env.SANDBOX_BASE_URL || 'https://api.sandbox.co.in',
    apiKey: process.env.SANDBOX_API_KEY || '',
    apiSecret: process.env.SANDBOX_API_SECRET || ''
  },

  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'razorpay',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || ''
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'LigiMed B2B Logistics <no-reply@ligimed.com>'
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    file: process.env.LOG_FILE || './logs/app.log'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000', 10)
  }
};
