const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const rateLimiter = require('../middleware/rateLimiter');

router.use(rateLimiter);

// User endpoints
router.post('/session', userController.getUserSession);
router.put('/preferences/:userId', userController.updatePreferences);
router.get('/stats/:userId', userController.getUserStats);
router.get('/history/:userId', userController.getUserChatHistory);
router.delete('/account/:userId', userController.deleteAccount);
router.get('/export/:userId', userController.exportUserData);

module.exports = router;