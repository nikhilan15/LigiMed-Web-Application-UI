import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error(`Error handling request [${req.method} ${req.url}]: ${err.message}`, { stack: err.stack });

  const statusCode = err.statusCode || err.status || 500;
  const isDev = process.env.NODE_ENV === 'development' && process.env.EXPOSE_STACK_TRACE === 'true';

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal Server Error' : (err.message || 'An error occurred'),
    error: isDev ? err.message : undefined
  });
}

