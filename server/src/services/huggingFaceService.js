const { HfInference } = require('@huggingface/inference');
const env = require('../config/env');
const NodeCache = require('node-cache');

class HuggingFaceService {
  constructor() {
    this.client = new HfInference(env.HF_API_TOKEN);
    this.cache = new NodeCache({ stdTTL: env.CACHE_TTL });
    this.model = env.HF_MODEL;
  }

  async generateResponse(prompt, context = {}) {
    const cacheKey = `response:${prompt}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await this.client.textGeneration({
        model: this.model,
        inputs: this.buildIslamicPrompt(prompt, context),
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true,
          repetition_penalty: 1.1
        }
      });

      const result = {
        text: response.generated_text,
        model: this.model,
        timestamp: new Date().toISOString()
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('HuggingFace API Error:', error);
      throw new Error('Failed to generate response');
    }
  }

  buildIslamicPrompt(userQuestion, context) {
    return `You are an Islamic AI assistant called Suleman AI. Provide accurate, respectful answers based on Quran and authentic Hadith.

Context from Islamic sources:
${context.retrievedText || 'No specific context provided'}

User Question: ${userQuestion}

Guidelines:
- Answer based on Quran and Sunnah
- If unsure, say "Allahu alim (Allah knows best)"
- Cite sources when possible
- Be respectful and compassionate
- Avoid extremism or harshness

Answer:`;
  }

  async getEmbeddings(text) {
    try {
      const response = await this.client.featureExtraction({
        model: env.EMBEDDING_MODEL,
        inputs: text
      });
      return response;
    } catch (error) {
      console.error('Embedding Error:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  async classifyIntent(text) {
    try {
      const response = await this.client.textClassification({
        model: 'facebook/bart-large-mnli',
        inputs: text,
        parameters: {
          candidateLabels: ['quran', 'hadith', 'fiqh', 'aqeedah', 'dua', 'general']
        }
      });
      return response;
    } catch (error) {
      console.error('Classification Error:', error);
      return { labels: ['general'], scores: [1.0] };
    }
  }
}

module.exports = new HuggingFaceService();