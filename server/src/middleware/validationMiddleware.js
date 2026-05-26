const validators = require('../utils/validators');

class ValidationMiddleware {
  validateChat(req, res, next) {
    const { error } = validators.validateChatMessage(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }
    next();
  }
  
  validateUser(req, res, next) {
    const { error } = validators.validateUser(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }
    next();
  }
  
  validateFeedback(req, res, next) {
    const { error } = validators.validateFeedback(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }
    next();
  }
  
  validateSearch(req, res, next) {
    const { error } = validators.validateSearch(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }
    next();
  }
}

module.exports = new ValidationMiddleware();