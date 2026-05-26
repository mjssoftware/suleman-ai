const app = require('./app');
const env = require('./config/env');
const database = require('./config/database');
const islamicDataService = require('./services/islamicDataService');

const PORT = env.PORT;

// Graceful shutdown function
const gracefulShutdown = async () => {
  console.log('🛑 Received shutdown signal, closing gracefully...');
  
  try {
    // Close database connection
    await database.disconnect();
    console.log('✅ Database connection closed');
    
    // Close server
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Load Islamic data on startup
const initializeServices = async () => {
  try {
    console.log('🕌 Loading Islamic datasets...');
    await islamicDataService.init();
    console.log('✅ Islamic datasets loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load Islamic datasets:', error);
    process.exit(1);
  }
};

// Start server
const server = app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║     🕌 SULEMAN AI - Islamic Chatbot API 🕌        ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║  Server:    http://localhost:${PORT}                  ║
║  Environment: ${env.NODE_ENV.padEnd(34)}║
║  Model:     ${env.HF_MODEL.substring(0, 34).padEnd(34)}║
╚═══════════════════════════════════════════════════╝
  `);
  
  await initializeServices();
});

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  gracefulShutdown();
});

module.exports = server;