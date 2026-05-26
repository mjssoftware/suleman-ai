const ChatHistory = require('../models/ChatHistory');
const UserSession = require('../models/UserSession');
const Feedback = require('../models/Feedback');
const huggingFaceService = require('../services/huggingFaceService');

class ChatController {
  // Send message and get AI response
  async sendMessage(req, res) {
    try {
      const { message, userId, sessionId, madhhab = 'general', language = 'en' } = req.body;
      
      if (!message || !userId) {
        return res.status(400).json({ error: 'Message and userId are required' });
      }

      // Get or create user session
      let userSession = await UserSession.findOne({ userId });
      if (!userSession) {
        userSession = await UserSession.create({
          userId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      }

      // Classify the question intent
      const intent = await huggingFaceService.classifyIntent(message);
      const category = intent[0]?.label || 'general';

      // Update user statistics
      await userSession.incrementMessages(category);

      // Get previous conversation context
      let chatHistory = await ChatHistory.findOne({ sessionId, userId });
      let conversationContext = '';
      
      if (chatHistory && chatHistory.messages.length > 0) {
        const lastMessages = chatHistory.messages.slice(-3);
        conversationContext = lastMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      }

      // Generate AI response
      const aiResponse = await huggingFaceService.generateResponse(message, {
        retrievedText: conversationContext,
        madhhab,
        language
      });

      // Prepare citations (simplified - you'll add actual retrieval later)
      const citations = [];

      // Save user message
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
        metadata: { intent: category }
      };

      // Save AI response
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse.text,
        citations: citations,
        timestamp: new Date(),
        metadata: {
          confidence: 0.85,
          modelUsed: huggingFaceService.model
        }
      };

      // Update or create chat history
      if (!chatHistory) {
        chatHistory = await ChatHistory.create({
          userId,
          sessionId,
          title: message.substring(0, 50),
          messages: [userMessage, assistantMessage],
          islamicContext: { madhhab, language }
        });
      } else {
        chatHistory.messages.push(userMessage, assistantMessage);
        await chatHistory.save();
      }

      res.json({
        success: true,
        response: aiResponse.text,
        citations: citations,
        messageId: assistantMessage._id,
        sessionId: chatHistory.sessionId,
        intent: category
      });

    } catch (error) {
      console.error('Chat Error:', error);
      res.status(500).json({ error: 'Failed to process your request. Please try again.' });
    }
  }

  // Get chat history for a user/session
  async getChatHistory(req, res) {
    try {
      const { userId, sessionId, limit = 50, page = 1 } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const query = { userId };
      if (sessionId) {
        query.sessionId = sessionId;
      }

      const skip = (page - 1) * limit;
      
      const histories = await ChatHistory.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await ChatHistory.countDocuments(query);

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
      console.error('Get History Error:', error);
      res.status(500).json({ error: 'Failed to retrieve chat history' });
    }
  }

  // Get single conversation
  async getConversation(req, res) {
    try {
      const { sessionId } = req.params;
      const { userId } = req.query;

      if (!userId || !sessionId) {
        return res.status(400).json({ error: 'userId and sessionId are required' });
      }

      const conversation = await ChatHistory.findOne({ sessionId, userId });
      
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('Get Conversation Error:', error);
      res.status(500).json({ error: 'Failed to retrieve conversation' });
    }
  }

  // Submit feedback
  async submitFeedback(req, res) {
    try {
      const { 
        userId, sessionId, messageId, userQuestion, aiResponse,
        rating, helpful, comment, corrections 
      } = req.body;

      if (!userId || !messageId || !rating) {
        return res.status(400).json({ error: 'userId, messageId, and rating are required' });
      }

      const feedback = await Feedback.create({
        userId,
        sessionId,
        messageId,
        userQuestion,
        aiResponse,
        rating,
        helpful,
        comment,
        corrections
      });

      res.json({
        success: true,
        message: 'Feedback submitted successfully',
        feedbackId: feedback._id
      });
    } catch (error) {
      console.error('Feedback Error:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  }

  // Delete conversation
  async deleteConversation(req, res) {
    try {
      const { sessionId } = req.params;
      const { userId } = req.body;

      if (!userId || !sessionId) {
        return res.status(400).json({ error: 'userId and sessionId are required' });
      }

      const result = await ChatHistory.findOneAndDelete({ sessionId, userId });
      
      if (!result) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      res.json({
        success: true,
        message: 'Conversation deleted successfully'
      });
    } catch (error) {
      console.error('Delete Conversation Error:', error);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  }
}

module.exports = new ChatController();