const ChatHistory = require('../models/ChatHistory');
const UserSession = require('../models/UserSession');
const huggingFaceService = require('../services/huggingFaceService');
const islamicDataService = require('../services/islamicDataService');

class QAController {
  // Direct QA without conversation history
  async askQuestion(req, res) {
    try {
      const { question, userId, context = {} } = req.body;
      
      if (!question || !userId) {
        return res.status(400).json({ error: 'Question and userId are required' });
      }

      // Search for relevant Islamic content first
      const relevantContent = await islamicDataService.searchIslamicContent(question);
      
      // Generate AI response with context
      const prompt = this.buildQAPrompt(question, relevantContent, context);
      const response = await huggingFaceService.generateResponse(prompt);
      
      // Format citations
      const citations = this.formatCitations(relevantContent);
      
      res.json({
        success: true,
        answer: response.text,
        citations: citations,
        confidence: 0.85,
        relatedQuestions: this.generateRelatedQuestions(question)
      });
      
    } catch (error) {
      console.error('QA Error:', error);
      res.status(500).json({ error: 'Failed to answer question' });
    }
  }

  buildQAPrompt(question, relevantContent, context) {
    let contextText = '';
    
    if (relevantContent.quran && relevantContent.quran.length > 0) {
      contextText += '\nRelevant Quranic Verses:\n';
      relevantContent.quran.slice(0, 3).forEach(item => {
        contextText += `- ${item.surah}:${item.verses[0].verse_id} - ${item.verses[0].text}\n`;
      });
    }
    
    if (relevantContent.hadith && relevantContent.hadith.length > 0) {
      contextText += '\nRelevant Hadith:\n';
      relevantContent.hadith.slice(0, 3).forEach(hadith => {
        contextText += `- ${hadith.reference}: ${hadith.text_simple || hadith.text_english}\n`;
      });
    }
    
    return `You are Suleman AI, an Islamic assistant. Answer based on Quran and authentic Hadith.
    
${contextText}

User Question: ${question}

${context.madhhab ? `Answer according to ${context.madhhab} madhhab when applicable.` : ''}

Provide a clear, respectful answer with Islamic perspective. If unsure, say "Allahu alim (Allah knows best)".

Answer:`;
  }

  formatCitations(content) {
    const citations = [];
    
    if (content.quran && content.quran.length > 0) {
      content.quran.slice(0, 3).forEach(item => {
        citations.push({
          type: 'quran',
          reference: `${item.surah}:${item.verses[0].verse_id}`,
          text: item.verses[0].text.substring(0, 200)
        });
      });
    }
    
    if (content.hadith && content.hadith.length > 0) {
      content.hadith.slice(0, 3).forEach(hadith => {
        citations.push({
          type: 'hadith',
          reference: hadith.reference,
          text: (hadith.text_simple || hadith.text_english).substring(0, 200),
          grade: hadith.grade
        });
      });
    }
    
    return citations;
  }

  generateRelatedQuestions(question) {
    // Simplified - can be enhanced with AI
    const keywords = {
      'prayer': ['What are the 5 daily prayers?', 'How to perform wudu?', 'What breaks the prayer?'],
      'fasting': ['When is Ramadan?', 'Who is exempt from fasting?', 'What breaks the fast?'],
      'zakat': ['How much is zakat?', 'Who receives zakat?', 'When to pay zakat?'],
      'hajj': ['What are the pillars of Hajj?', 'When is Hajj performed?', 'What is Umrah?'],
      'quran': ['How to memorize Quran?', 'Benefits of reading Quran', 'What is Tajweed?']
    };
    
    for (const [key, questions] of Object.entries(keywords)) {
      if (question.toLowerCase().includes(key)) {
        return questions;
      }
    }
    
    return ['What does Islam say about patience?', 'How to increase faith?', 'What are the major sins?'];
  }

  // Get answer for FAQ
  async getFAQ(req, res) {
    const faqs = {
      'five-pillars': {
        question: 'What are the 5 pillars of Islam?',
        answer: 'The 5 pillars of Islam are: 1) Shahada (declaration of faith), 2) Salah (5 daily prayers), 3) Zakat (obligatory charity), 4) Sawm (fasting in Ramadan), 5) Hajj (pilgrimage to Makkah once in a lifetime if able).',
        references: ['Bukhari 1:2', 'Muslim 1:5']
      },
      'islam-definition': {
        question: 'What is Islam?',
        answer: 'Islam means submission to the will of Allah. It is the final and complete religion revealed to Prophet Muhammad (peace be upon him) for all humanity.',
        references: ['Quran 5:3', 'Quran 3:19']
      }
    };
    
    const { id } = req.params;
    if (faqs[id]) {
      res.json({ success: true, data: faqs[id] });
    } else {
      res.status(404).json({ error: 'FAQ not found' });
    }
  }
}

module.exports = new QAController();