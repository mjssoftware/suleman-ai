const UserSession = require('../models/UserSession');
const ChatHistory = require('../models/ChatHistory');
const Feedback = require('../models/Feedback');
const crypto = require('crypto');

class UserController {
  // Create or get user session
  async getUserSession(req, res) {
    try {
      let { userId, email } = req.body;
      
      if (!userId) {
        // Generate anonymous ID if not provided
        userId = `anon_${crypto.randomBytes(16).toString('hex')}`;
      }
      
      let userSession = await UserSession.findOne({ userId });
      
      if (!userSession) {
        userSession = await UserSession.create({
          userId,
          email: email || null,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } else {
        // Update last login
        userSession.lastLoginAt = Date.now();
        userSession.statistics.lastActive = Date.now();
        await userSession.save();
      }
      
      res.json({
        success: true,
        data: {
          userId: userSession.userId,
          preferences: userSession.preferences,
          statistics: userSession.statistics,
          createdAt: userSession.createdAt
        }
      });
    } catch (error) {
      console.error('Get user session error:', error);
      res.status(500).json({ error: 'Failed to get user session' });
    }
  }
  
  // Update user preferences
  async updatePreferences(req, res) {
    try {
      const { userId } = req.params;
      const { preferences } = req.body;
      
      const userSession = await UserSession.findOne({ userId });
      
      if (!userSession) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update preferences
      userSession.preferences = {
        ...userSession.preferences,
        ...preferences
      };
      
      await userSession.save();
      
      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: userSession.preferences
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }
  
  // Get user statistics
  async getUserStats(req, res) {
    try {
      const { userId } = req.params;
      
      const userSession = await UserSession.findOne({ userId });
      
      if (!userSession) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get chat sessions count
      const chatSessions = await ChatHistory.countDocuments({ userId });
      
      // Get feedback stats
      const feedbacks = await Feedback.find({ userId });
      const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / (feedbacks.length || 1);
      
      res.json({
        success: true,
        data: {
          sessions: userSession.statistics,
          totalChatSessions: chatSessions,
          totalFeedbacks: feedbacks.length,
          averageRating: avgRating.toFixed(2),
          memberSince: userSession.createdAt,
          lastActive: userSession.statistics.lastActive
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Failed to get user statistics' });
    }
  }
  
  // Get user chat history
  async getUserChatHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20, page = 1 } = req.query;
      
      const skip = (page - 1) * limit;
      
      const histories = await ChatHistory.find({ userId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('sessionId title messages.length updatedAt');
      
      const total = await ChatHistory.countDocuments({ userId });
      
      res.json({
        success: true,
        data: histories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get user chat history error:', error);
      res.status(500).json({ error: 'Failed to get chat history' });
    }
  }
  
  // Delete user account and all data
  async deleteAccount(req, res) {
    try {
      const { userId } = req.params;
      const { confirm } = req.body;
      
      if (!confirm || confirm !== 'DELETE') {
        return res.status(400).json({ error: 'Please type "DELETE" to confirm account deletion' });
      }
      
      // Delete all user data
      await UserSession.findOneAndDelete({ userId });
      await ChatHistory.deleteMany({ userId });
      await Feedback.deleteMany({ userId });
      
      res.json({
        success: true,
        message: 'Account and all associated data deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  }
  
  // Export user data
  async exportUserData(req, res) {
    try {
      const { userId } = req.params;
      const { format = 'json' } = req.query;
      
      const userSession = await UserSession.findOne({ userId });
      const chatHistory = await ChatHistory.find({ userId });
      const feedbacks = await Feedback.find({ userId });
      
      const exportData = {
        user: userSession,
        conversations: chatHistory,
        feedbacks: feedbacks,
        exportDate: new Date().toISOString()
      };
      
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=suleman-ai-data-${userId}.json`);
        res.json(exportData);
      } else {
        res.status(400).json({ error: 'Unsupported format' });
      }
    } catch (error) {
      console.error('Export data error:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  }
}

module.exports = new UserController();