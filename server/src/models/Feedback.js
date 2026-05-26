const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userQuestion: {
    type: String,
    required: true
  },
  aiResponse: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer'
    }
  },
  helpful: {
    type: Boolean,
    required: true
  },
  categories: [{
    type: String,
    enum: ['accurate', 'inaccurate', 'helpful', 'not-helpful', 'citations-helpful', 'citations-missing']
  }],
  comment: {
    type: String,
    maxlength: 500
  },
  corrections: {
    type: String,
    maxlength: 1000
  },
  metadata: {
    responseTime: Number,
    modelUsed: String,
    hadithGrades: [String],
    sourcesCount: Number
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'ignored'],
    default: 'pending'
  },
  adminNotes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ status: 1 });

// Static method to get average rating for a user
feedbackSchema.statics.getUserAverageRating = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: userId, helpful: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalFeedback: { $sum: 1 } } }
  ]);
  return result[0] || { avgRating: 0, totalFeedback: 0 };
};

// Static method to get problematic responses (low ratings)
feedbackSchema.statics.getProblematicResponses = async function(threshold = 2) {
  return await this.find({ 
    rating: { $lte: threshold },
    status: 'pending'
  })
  .sort({ createdAt: -1 })
  .limit(50);
};

module.exports = mongoose.model('Feedback', feedbackSchema);