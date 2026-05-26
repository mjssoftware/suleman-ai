const { HfInference } = require('@huggingface/inference');
const env = require('../config/env');

class EmbeddingService {
  constructor() {
    this.client = new HfInference(env.HF_API_TOKEN);
    this.model = env.EMBEDDING_MODEL;
  }
  
  // Generate embeddings for text
  async generateEmbedding(text) {
    try {
      const response = await this.client.featureExtraction({
        model: this.model,
        inputs: text
      });
      
      return response;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }
  
  // Generate embeddings for batch of texts
  async generateBatchEmbeddings(texts) {
    try {
      const embeddings = await Promise.all(
        texts.map(text => this.generateEmbedding(text))
      );
      
      return embeddings;
    } catch (error) {
      console.error('Batch embedding error:', error);
      throw error;
    }
  }
  
  // Calculate cosine similarity between two vectors
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  // Find most similar texts
  async findSimilar(query, candidates, topK = 5) {
    const queryEmbedding = await this.generateEmbedding(query);
    
    const similarities = await Promise.all(
      candidates.map(async (candidate) => {
        let candidateEmbedding;
        
        if (candidate.embedding) {
          candidateEmbedding = candidate.embedding;
        } else {
          candidateEmbedding = await this.generateEmbedding(candidate.text);
        }
        
        const similarity = this.cosineSimilarity(queryEmbedding, candidateEmbedding);
        
        return {
          ...candidate,
          similarity
        };
      })
    );
    
    // Sort by similarity and return top K
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}

module.exports = new EmbeddingService();