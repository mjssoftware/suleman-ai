const helmet = require('helmet');
const cors = require('cors');

class SecurityMiddleware {
  // Configure CORS
  configureCors() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    return cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    });
  }
  
  // Configure Helmet for security headers
  configureHelmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }
  
  // Prevent parameter pollution
  preventParameterPollution(req, res, next) {
    const duplicateParams = [];
    
    for (const param in req.query) {
      if (Array.isArray(req.query[param]) && req.query[param].length > 1) {
        duplicateParams.push(param);
      }
    }
    
    if (duplicateParams.length > 0) {
      return res.status(400).json({
        error: 'Duplicate parameters not allowed',
        params: duplicateParams
      });
    }
    
    next();
  }
  
  // Add security headers
  addSecurityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  }
}

module.exports = new SecurityMiddleware();