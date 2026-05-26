const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const rateLimiter = require('../middleware/rateLimiter');

// Apply rate limiting to chat endpoints
router.use(rateLimiter);

// Chat endpoints
router.post('/send', chatController.sendMessage);
router.get('/history', chatController.getChatHistory);
router.get('/conversation/:sessionId', chatController.getConversation);
router.delete('/conversation/:sessionId', chatController.deleteConversation);
router.post('/feedback', chatController.submitFeedback);

module.exports = router;