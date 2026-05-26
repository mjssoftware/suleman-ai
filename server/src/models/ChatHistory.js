const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  citations: [{
    type: {
      source: {
        type: String,
        enum: ['quran', 'hadith', 'tafsir', 'scholar'],
        required: true
      },
      reference: String, // e.g., "Surah Al-Baqarah [2:255]" or "Bukhari 1234"
      text: String,
      grade: String, // For hadith: Sahih, Da'if, etc.
      url: String
    }
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    confidence: Number,
    processingTime: Number,
    modelUsed: String
  }
});

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [messageSchema],
  islamicContext: {
    madhhab: {
      type: String,
      enum: ['hanafi', 'maliki', 'shafii', 'hanbali', 'general'],
      default: 'general'
    },
    includeCitations: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      enum: ['en', 'ar', 'ur', 'id'],
      default: 'en'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
chatHistorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
chatHistorySchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);