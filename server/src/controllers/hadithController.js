const islamicDataService = require('../services/islamicDataService');
const redis = require('../config/redis');

class HadithController {
  // Get specific hadith
  async getHadith(req, res) {
    try {
      const { collection, id } = req.params;
      
      if (!collection || !id) {
        return res.status(400).json({ error: 'Collection and hadith ID are required' });
      }
      
      const cacheKey = `hadith:${collection}:${id}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }
      
      const hadith = await islamicDataService.getHadith(collection, parseInt(id));
      
      if (!hadith) {
        return res.status(404).json({ error: 'Hadith not found' });
      }
      
      await redis.set(cacheKey, hadith, 3600);
      
      res.json({ success: true, data: hadith });
    } catch (error) {
      console.error('Get hadith error:', error);
      res.status(500).json({ error: 'Failed to retrieve hadith' });
    }
  }
  
  // Search in hadith
  async search(req, res) {
    try {
      const { q, collection = 'all', grade = 'all', limit = 20, page = 1 } = req.query;
      
      if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }
      
      const results = await islamicDataService.searchInHadith(q, collection, grade, parseInt(limit), parseInt(page));
      
      res.json({
        success: true,
        data: results.data,
        pagination: results.pagination,
        filters: { collection, grade }
      });
    } catch (error) {
      console.error('Search hadith error:', error);
      res.status(500).json({ error: 'Failed to search hadith' });
    }
  }
  
  // Get hadith by chapter
  async getByChapter(req, res) {
    try {
      const { collection, chapter } = req.params;
      const { limit = 50 } = req.query;
      
      const hadiths = await islamicDataService.getHadithByChapter(collection, chapter, parseInt(limit));
      
      res.json({
        success: true,
        data: hadiths,
        collection: collection,
        chapter: chapter
      });
    } catch (error) {
      console.error('Get by chapter error:', error);
      res.status(500).json({ error: 'Failed to retrieve hadith' });
    }
  }
  
  // Get random hadith
  async getRandom(req, res) {
    try {
      const { collection = 'all' } = req.query;
      
      const randomHadith = await islamicDataService.getRandomHadith(collection);
      
      res.json({
        success: true,
        data: randomHadith
      });
    } catch (error) {
      console.error('Get random hadith error:', error);
      res.status(500).json({ error: 'Failed to retrieve random hadith' });
    }
  }
  
  // Get hadith collections info
  async getCollections(req, res) {
    try {
      const collections = {
        bukhari: {
          name: 'Sahih al-Bukhari',
          total: 7563,
          grade: 'Sahih',
          description: 'Most authentic hadith collection'
        },
        muslim: {
          name: 'Sahih Muslim',
          total: 9200,
          grade: 'Sahih',
          description: 'Second most authentic collection'
        },
        abudawud: {
          name: 'Sunan Abu Dawud',
          total: 5274,
          grade: 'Hasan/Sahih',
          description: 'Collection of legal rulings'
        },
        tirmidhi: {
          name: 'Jami al-Tirmidhi',
          total: 3956,
          grade: 'Hasan/Sahih',
          description: 'Contains classification of hadith grades'
        }
      };
      
      res.json({ success: true, data: collections });
    } catch (error) {
      console.error('Get collections error:', error);
      res.status(500).json({ error: 'Failed to retrieve collections' });
    }
  }
  
  // Get hadith grading explanation
  async getGradingInfo(req, res) {
    try {
      const gradings = await islamicDataService.getHadithGradings();
      
      res.json({ success: true, data: gradings });
    } catch (error) {
      console.error('Get grading info error:', error);
      res.status(500).json({ error: 'Failed to retrieve grading info' });
    }
  }
}

module.exports = new HadithController();