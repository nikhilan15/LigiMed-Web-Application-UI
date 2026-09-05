import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logFilePath = path.resolve(__dirname, '../../', config.logging.file);
const logDir = path.dirname(logFilePath);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
}

function writeLog(level, message, meta) {
  const formatted = formatLog(level, message, meta);
  // Log to stdout
  if (level === 'error') {
    console.error(formatted.trim());
  } else {
    console.log(formatted.trim());
  }

  // Write to log file asynchronously
  fs.appendFile(logFilePath, formatted, (err) => {
    if (err) console.error('Failed to write to log file:', err);
  });
}

export const logger = {
  info: (msg, meta) => writeLog('info', msg, meta),
  debug: (msg, meta) => writeLog('debug', msg, meta),
  warn: (msg, meta) => writeLog('warn', msg, meta),
  error: (msg, meta) => writeLog('error', msg, meta)
};
