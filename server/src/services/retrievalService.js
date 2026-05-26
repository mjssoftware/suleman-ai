const embeddingService = require('./embeddingService');
const islamicDataService = require('./islamicDataService');
const redis = require('../config/redis');

class RetrievalService {
  constructor() {
    this.corpus = [];
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    // Load Islamic corpus for retrieval
    const quranVerses = await this.loadQuranCorpus();
    const hadithTexts = await this.loadHadithCorpus();
    
    this.corpus = [...quranVerses, ...hadithTexts];
    this.initialized = true;
    
    console.log(`Retrieval service initialized with ${this.corpus.length} documents`);
  }
  
  async loadQuranCorpus() {
    const verses = [];
    const quranData = await islamicDataService.getQuranData();
    
    if (quranData && quranData.surahs) {
      for (const surah of quranData.surahs) {
        if (surah.verses) {
          for (const verse of surah.verses) {
            verses.push({
              id: `${surah.id}:${verse.verse_id}`,
              text: verse.text,
              type: 'quran',
              metadata: {
                surah: surah.id,
                surahName: surah.name,
                verse: verse.verse_id
              }
            });
          }
        }
      }
    }
    
    return verses;
  }
  
  async loadHadithCorpus() {
    const hadiths = [];
    const bukhari = await islamicDataService.getHadithCollection('bukhari');
    
    if (bukhari && bukhari.hadiths) {
      for (const hadith of bukhari.hadiths) {
        hadiths.push({
          id: `bukhari:${hadith.id}`,
          text: hadith.text_english,
          type: 'hadith',
          metadata: {
            collection: 'bukhari',
            reference: hadith.reference,
            grade: hadith.grade
          }
        });
      }
    }
    
    return hadiths;
  }
  
  async retrieve(query, topK = 5) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Check cache
    const cacheKey = `retrieval:${query}:${topK}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Find similar documents
    const results = await embeddingService.findSimilar(query, this.corpus, topK);
    
    // Filter by relevance threshold
    const relevantResults = results.filter(r => r.similarity > 0.5);
    
    // Cache results
    await redis.set(cacheKey, relevantResults, 1800); // Cache for 30 minutes
    
    return relevantResults;
  }
  
  async retrieveWithFilters(query, filters, topK = 5) {
    let results = await this.retrieve(query, topK * 2);
    
    // Apply filters
    if (filters.type) {
      results = results.filter(r => r.type === filters.type);
    }
    
    if (filters.collection && filters.type === 'hadith') {
      results = results.filter(r => r.metadata.collection === filters.collection);
    }
    
    if (filters.minGrade && filters.type === 'hadith') {
      const gradeOrder = { sahih: 3, hasan: 2, daif: 1 };
      results = results.filter(r => 
        gradeOrder[r.metadata.grade?.toLowerCase()] >= gradeOrder[filters.minGrade]
      );
    }
    
    return results.slice(0, topK);
  }
  
  async getContextForQuery(query, maxTokens = 1000) {
    const relevantDocs = await this.retrieve(query, 3);
    
    let context = '';
    let tokenCount = 0;
    
    for (const doc of relevantDocs) {
      const docText = `[${doc.type.toUpperCase()}] ${doc.text}\n`;
      const docTokens = docText.length / 4; // Rough token estimation
      
      if (tokenCount + docTokens <= maxTokens) {
        context += docText;
        tokenCount += docTokens;
      } else {
        break;
      }
    }
    
    return {
      context,
      sources: relevantDocs.slice(0, 3).map(doc => ({
        type: doc.type,
        reference: doc.id,
        similarity: doc.similarity
      }))
    };
  }
}

module.exports = new RetrievalService();