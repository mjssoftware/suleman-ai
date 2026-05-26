const islamicDataService = require('../services/islamicDataService');
const redis = require('../config/redis');

class QuranController {
  // Get specific verse
  async getVerse(req, res) {
    try {
      const { surah, verse } = req.params;
      const { language = 'english' } = req.query;
      
      if (!surah || !verse) {
        return res.status(400).json({ error: 'Surah and verse numbers are required' });
      }
      
      // Check cache
      const cacheKey = `quran:verse:${surah}:${verse}:${language}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }
      
      const verseData = await islamicDataService.getVerse(parseInt(surah), parseInt(verse), language);
      
      if (!verseData) {
        return res.status(404).json({ error: 'Verse not found' });
      }
      
      // Cache for 1 hour
      await redis.set(cacheKey, verseData, 3600);
      
      res.json({ success: true, data: verseData });
    } catch (error) {
      console.error('Get verse error:', error);
      res.status(500).json({ error: 'Failed to retrieve verse' });
    }
  }
  
  // Get entire surah
  async getSurah(req, res) {
    try {
      const { surahId } = req.params;
      const { language = 'english' } = req.query;
      
      const surah = await islamicDataService.getSurah(parseInt(surahId), language);
      
      if (!surah) {
        return res.status(404).json({ error: 'Surah not found' });
      }
      
      res.json({ success: true, data: surah });
    } catch (error) {
      console.error('Get surah error:', error);
      res.status(500).json({ error: 'Failed to retrieve surah' });
    }
  }
  
  // Search in Quran
  async search(req, res) {
    try {
      const { q, limit = 10, page = 1 } = req.query;
      
      if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }
      
      const results = await islamicDataService.searchInQuran(q, parseInt(limit), parseInt(page));
      
      res.json({
        success: true,
        data: results.results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: results.total,
          totalPages: Math.ceil(results.total / limit)
        }
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to search' });
    }
  }
  
  // Get verse by topic
  async getVerseByTopic(req, res) {
    try {
      const { topic } = req.params;
      
      const verses = await islamicDataService.getVersesByTopic(topic);
      
      res.json({
        success: true,
        data: verses,
        topic: topic
      });
    } catch (error) {
      console.error('Get verse by topic error:', error);
      res.status(500).json({ error: 'Failed to retrieve verses' });
    }
  }
  
  // Get random verse
  async getRandomVerse(req, res) {
    try {
      const randomVerse = await islamicDataService.getRandomVerse();
      
      res.json({
        success: true,
        data: randomVerse
      });
    } catch (error) {
      console.error('Get random verse error:', error);
      res.status(500).json({ error: 'Failed to retrieve random verse' });
    }
  }
  
  // Get Tafsir for verse
  async getTafsir(req, res) {
    try {
      const { surah, verse } = req.params;
      
      const tafsir = await islamicDataService.getTafsir(parseInt(surah), parseInt(verse));
      
      if (!tafsir) {
        return res.status(404).json({ error: 'Tafsir not found for this verse' });
      }
      
      res.json({ success: true, data: tafsir });
    } catch (error) {
      console.error('Get tafsir error:', error);
      res.status(500).json({ error: 'Failed to retrieve tafsir' });
    }
  }
}

module.exports = new QuranController();