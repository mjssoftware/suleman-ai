const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Create stream for Morgan integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Log API requests
logger.logAPIRequest = (req, duration) => {
  logger.info({
    type: 'API_REQUEST',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.userId || 'anonymous',
    duration: `${duration}ms`,
    userAgent: req.get('user-agent')
  });
};

// Log API errors
logger.logAPIError = (req, error, statusCode) => {
  logger.error({
    type: 'API_ERROR',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.userId || 'anonymous',
    error: error.message,
    statusCode: statusCode,
    stack: error.stack
  });
};

// Log user actions
logger.logUserAction = (userId, action, details = {}) => {
  logger.info({
    type: 'USER_ACTION',
    userId,
    action,
    ...details,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;