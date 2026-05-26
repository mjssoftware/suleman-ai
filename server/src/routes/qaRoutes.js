const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qaController');
const rateLimiter = require('../middleware/rateLimiter');
const validationMiddleware = require('../middleware/validationMiddleware');

router.use(rateLimiter);

// QA endpoints
router.post('/ask', validationMiddleware.validateChat, qaController.askQuestion);
router.get('/faq/:id', qaController.getFAQ);

module.exports = router;