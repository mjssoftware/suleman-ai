const redis = require('../config/redis');

class CacheMiddleware {
  // Cache GET requests
  cache( duration = 3600) {
    return async (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      const key = `cache:${req.originalUrl || req.url}`;
      
      try {
        const cachedData = await redis.get(key);
        
        if (cachedData) {
          return res.json({
            ...cachedData,
            cached: true,
            cachedAt: new Date().toISOString()
          });
        }
        
        // Store original send function
        const originalJson = res.json;
        
        res.json = function(data) {
          // Cache successful responses
          if (res.statusCode === 200) {
            redis.set(key, data, duration).catch(console.error);
          }
          
          originalJson.call(this, data);
        };
        
        next();
      } catch (error) {
        console.error('Cache error:', error);
        next();
      }
    };
  }
  
  // Clear cache for a pattern
  async clearCache(pattern) {
    try {
      await redis.clearPattern(pattern);
      console.log(`Cleared cache for pattern: ${pattern}`);
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  }
  
  // Don't cache for certain paths
  noCache(req, res, next) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    next();
  }
}

module.exports = new CacheMiddleware();