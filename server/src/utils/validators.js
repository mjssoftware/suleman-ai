const Joi = require('joi');

class Validators {
  // Validate chat message
  validateChatMessage(data) {
    const schema = Joi.object({
      message: Joi.string().min(1).max(2000).required(),
      userId: Joi.string().required(),
      sessionId: Joi.string().optional(),
      madhhab: Joi.string().valid('hanafi', 'maliki', 'shafii', 'hanbali', 'general').default('general'),
      language: Joi.string().valid('en', 'ar', 'ur', 'id').default('en')
    });
    
    return schema.validate(data);
  }
  
  // Validate user registration
  validateUser(data) {
    const schema = Joi.object({
      email: Joi.string().email().optional(),
      userId: Joi.string().required(),
      preferences: Joi.object({
        theme: Joi.string().valid('light', 'dark', 'islamic'),
        language: Joi.string().valid('en', 'ar', 'ur', 'id', 'tr', 'bn'),
        notificationsEnabled: Joi.boolean()
      }).optional()
    });
    
    return schema.validate(data);
  }
  
  // Validate feedback
  validateFeedback(data) {
    const schema = Joi.object({
      userId: Joi.string().required(),
      sessionId: Joi.string().required(),
      messageId: Joi.string().required(),
      userQuestion: Joi.string().max(2000).required(),
      aiResponse: Joi.string().max(4000).required(),
      rating: Joi.number().integer().min(1).max(5).required(),
      helpful: Joi.boolean().required(),
      comment: Joi.string().max(500).optional(),
      corrections: Joi.string().max(1000).optional()
    });
    
    return schema.validate(data);
  }
  
  // Validate Quran query
  validateQuranQuery(data) {
    const schema = Joi.object({
      surah: Joi.number().integer().min(1).max(114),
      verse: Joi.number().integer().min(1).max(286),
      language: Joi.string().valid('arabic', 'english', 'both').default('english')
    });
    
    return schema.validate(data);
  }
  
  // Validate Hadith query
  validateHadithQuery(data) {
    const schema = Joi.object({
      collection: Joi.string().valid('bukhari', 'muslim', 'tirmidhi', 'abudawud', 'nasai', 'ibnmajah'),
      id: Joi.number().integer().min(1),
      grade: Joi.string().valid('sahih', 'hasan', 'daif', 'all').default('all')
    });
    
    return schema.validate(data);
  }
  
  // Validate search query
  validateSearch(data) {
    const schema = Joi.object({
      q: Joi.string().min(2).max(100).required(),
      limit: Joi.number().integer().min(1).max(100).default(20),
      page: Joi.number().integer().min(1).default(1),
      type: Joi.string().valid('all', 'quran', 'hadith', 'dua').default('all')
    });
    
    return schema.validate(data);
  }
  
  // Sanitize and validate Arabic text
  validateArabicText(text) {
    if (!text) return false;
    
    // Check for valid Arabic characters
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u0870-\u089F\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text);
  }
  
  // Check if question is Islamic-related
  isIslamicQuestion(question) {
    const islamicKeywords = [
      'allah', 'quran', 'hadith', 'prophet', 'muhammad', 'islam',
      'prayer', 'salah', 'fasting', 'zakat', 'hajj', 'ramadan',
      'mosque', 'imam', 'halal', 'haram', 'sunnah', 'dua', 'surah'
    ];
    
    const lowerQuestion = question.toLowerCase();
    return islamicKeywords.some(keyword => lowerQuestion.includes(keyword));
  }
}

module.exports = new Validators();