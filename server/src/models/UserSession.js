const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'islamic'],
      default: 'light'
    },
    language: {
      type: String,
      enum: ['en', 'ar', 'ur', 'id', 'tr', 'bn'],
      default: 'en'
    },
    defaultMadhhab: {
      type: String,
      enum: ['hanafi', 'maliki', 'shafii', 'hanbali', 'general'],
      default: 'general'
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    prayerTimesLocation: {
      city: String,
      country: String,
      latitude: Number,
      longitude: Number
    }
  },
  statistics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      default: 1
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    questionsByCategory: {
      aqeedah: { type: Number, default: 0 },
      fiqh: { type: Number, default: 0 },
      quran: { type: Number, default: 0 },
      hadith: { type: Number, default: 0 },
      seerah: { type: Number, default: 0 },
      duas: { type: Number, default: 0 },
      general: { type: Number, default: 0 }
    }
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
});

// Update lastActive on every interaction
userSessionSchema.methods.updateActivity = async function() {
  this.statistics.lastActive = Date.now();
  await this.save();
};

// Increment message count
userSessionSchema.methods.incrementMessages = async function(category = 'general') {
  this.statistics.totalMessages += 1;
  if (this.statistics.questionsByCategory[category]) {
    this.statistics.questionsByCategory[category] += 1;
  }
  await this.save();
};

module.exports = mongoose.model('UserSession', userSessionSchema);