const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

class SanitizeMiddleware {
  // Sanitize request body
  sanitizeBody(req, res, next) {
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }
    next();
  }
  
  // Sanitize request query
  sanitizeQuery(req, res, next) {
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }
    next();
  }
  
  // Sanitize object recursively
  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeValue(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize keys (remove dangerous characters)
      const safeKey = key.replace(/[^\w\s-]/gi, '');
      sanitized[safeKey] = this.sanitizeObject(value);
    }
    return sanitized;
  }
  
  // Sanitize individual value
  sanitizeValue(value) {
    if (typeof value === 'string') {
      // Remove HTML tags
      let cleaned = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
      
      // Remove SQL injection patterns
      cleaned = cleaned.replace(/(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bUNION\b)/gi, '');
      
      // Remove script tags
      cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Trim and limit length
      cleaned = cleaned.trim().substring(0, 2000);
      
      return cleaned;
    }
    
    if (typeof value === 'number') {
      // Ensure number is within safe range
      if (isNaN(value) || !isFinite(value)) return 0;
      return Math.min(Math.max(value, -1e6), 1e6);
    }
    
    if (typeof value === 'boolean') {
      return value;
    }
    
    return value;
  }
  
  // Check for profanity
  containsProfanity(text) {
    const profanityList = ['curse1', 'curse2']; // Add your list
    const lowerText = text.toLowerCase();
    return profanityList.some(word => lowerText.includes(word));
  }
  
  // Validate Islamic content appropriateness
  validateIslamicContent(text) {
    // Check for inappropriate content
    const inappropriate = [
      'shirk', 'kufr', 'blasphemy', 
      // Add more patterns
    ];
    
    const lowerText = text.toLowerCase();
    for (const word of inappropriate) {
      if (lowerText.includes(word) && !this.isInIslamicContext(text, word)) {
        return false;
      }
    }
    
    return true;
  }
  
  isInIslamicContext(text, word) {
    // Check if the word is used in an educational context
    const educationalPhrases = [
      `what is ${word}`,
      `meaning of ${word}`,
      `definition of ${word}`,
      `explain ${word}`
    ];
    
    const lowerText = text.toLowerCase();
    return educationalPhrases.some(phrase => lowerText.includes(phrase));
  }
}

module.exports = new SanitizeMiddleware();