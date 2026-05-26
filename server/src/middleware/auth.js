const jwt = require('jsonwebtoken');

class AuthMiddleware {
  // Generate JWT token
  generateToken(userId, email = null) {
    const payload = {
      userId,
      email,
      timestamp: Date.now()
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || 'suleman-ai-secret-key', {
      expiresIn: '30d'
    });
  }
  
  // Verify JWT token
  verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // Allow anonymous access but track user
      req.user = { isAnonymous: true };
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'suleman-ai-secret-key');
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  // Optional authentication (doesn't block if no token)
  optionalAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'suleman-ai-secret-key');
        req.user = decoded;
      } catch (error) {
        // Ignore invalid token for optional auth
      }
    }
    
    if (!req.user) {
      req.user = { isAnonymous: true };
    }
    
    next();
  }
  
  // Check if user is admin
  isAdmin(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
      req.isAdmin = true;
      return next();
    }
    
    return res.status(403).json({ error: 'Admin access required' });
  }
}

module.exports = new AuthMiddleware();