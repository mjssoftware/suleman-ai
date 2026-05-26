const express = require('express');
const router = express.Router();
const quranController = require('../controllers/quranController');
const rateLimiter = require('../middleware/rateLimiter');

router.use(rateLimiter);

// Quran endpoints
router.get('/verse/:surah/:verse', quranController.getVerse);
router.get('/surah/:surahId', quranController.getSurah);
router.get('/search', quranController.search);
router.get('/topic/:topic', quranController.getVerseByTopic);
router.get('/random', quranController.getRandomVerse);
router.get('/tafsir/:surah/:verse', quranController.getTafsir);

module.exports = router;