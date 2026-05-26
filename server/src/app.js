const express = require('express');
const path = require('path');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const database = require('./config/database');
const redis = require('./config/redis');
const env = require('./config/env');
const logger = require('./utils/logger');
const securityMiddleware = require('./middleware/securityMiddleware');
const errorHandler = require('./middleware/errorHandler');
const sanitize = require('./middleware/sanitize');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const chatRoutes = require('./routes/chatRoutes');
const quranRoutes = require('./routes/quranRoutes');
const hadithRoutes = require('./routes/hadithRoutes');
const userRoutes = require('./routes/userRoutes');
const qaRoutes = require('./routes/qaRoutes');

const app = express();

// Database connection
database.connect();

// Redis connection (optional)
redis.connect().catch(console.warn);

// Security middleware
app.use(securityMiddleware.configureHelmet());
app.use(securityMiddleware.configureCors());
app.use(securityMiddleware.addSecurityHeaders);
app.use(securityMiddleware.preventParameterPollution);

// Request parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitization
app.use(sanitize.sanitizeBody);
app.use(sanitize.sanitizeQuery);

// Logging
app.use(morgan('combined', { stream: logger.stream }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logAPIRequest(req, duration);
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: database.isConnectedToDB(),
    redis: redis.isConnected,
    environment: env.NODE_ENV
  });
});

// API routes
app.use('/api/chat', rateLimiter, chatRoutes);
app.use('/api/quran', quranRoutes);
app.use('/api/hadith', hadithRoutes);
app.use('/api/user', userRoutes);
app.use('/api/qa', qaRoutes);

// Serve static files in production
if (env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client', 'index.html'));
  });
}

// 404 handler
app.use(errorHandler.handleNotFound);

// Global error handler
app.use(errorHandler.handleError);

module.exports = app;