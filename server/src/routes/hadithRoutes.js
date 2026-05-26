const express = require('express');
const router = express.Router();
const hadithController = require('../controllers/hadithController');
const rateLimiter = require('../middleware/rateLimiter');

router.use(rateLimiter);

// Hadith endpoints
router.get('/:collection/:id', hadithController.getHadith);
router.get('/search', hadithController.search);
router.get('/chapter/:collection/:chapter', hadithController.getByChapter);
router.get('/random', hadithController.getRandom);
router.get('/collections/info', hadithController.getCollections);
router.get('/gradings/info', hadithController.getGradingInfo);

module.exports = router;