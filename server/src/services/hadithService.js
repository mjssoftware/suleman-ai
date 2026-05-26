const dataLoader = require('../data/utils/dataLoader');

class HadithService {
  constructor() {
    this.hadithData = null;
  }
  
  async init() {
    if (!this.hadithData) {
      await dataLoader.loadAll();
      this.hadithData = dataLoader.data.hadith;
    }
  }
  
  async getHadith(collection, id) {
    await this.init();
    
    const collectionData = this.hadithData[collection];
    if (!collectionData) return null;
    
    // Search in chapters
    if (collectionData.chapters) {
      for (const chapter in collectionData.chapters) {
        const hadith = collectionData.chapters[chapter].find(h => h.id === id);
        if (hadith) return hadith;
      }
    }
    
    // Search in direct hadiths array
    if (collectionData.hadiths) {
      return collectionData.hadiths.find(h => h.id === id);
    }
    
    return null;
  }
  
  async search(query, collection = 'all', grade = 'all', limit = 20, page = 1) {
    await this.init();
    
    const results = [];
    const collections = collection === 'all' 
      ? ['bukhari', 'muslim'] 
      : [collection];
    
    for (const col of collections) {
      const collectionData = this.hadithData[col];
      if (!collectionData) continue;
      
      const hadiths = this.extractAllHadiths(collectionData);
      
      for (const hadith of hadiths) {
        if (this.matchesSearch(hadith, query, grade)) {
          results.push({
            ...hadith,
            collection: col
          });
        }
      }
    }
    
    // Sort by relevance and grade
    results.sort((a, b) => {
      const gradeScore = (g) => ({ sahih: 3, hasan: 2, daif: 1 }[g?.toLowerCase()] || 0);
      return gradeScore(b.grade) - gradeScore(a.grade);
    });
    
    const skip = (page - 1) * limit;
    
    return {
      data: results.slice(skip, skip + limit),
      total: results.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(results.length / limit)
      }
    };
  }
  
  extractAllHadiths(collectionData) {
    const hadiths = [];
    
    if (collectionData.chapters) {
      for (const chapter in collectionData.chapters) {
        hadiths.push(...collectionData.chapters[chapter]);
      }
    }
    
    if (collectionData.hadiths) {
      hadiths.push(...collectionData.hadiths);
    }
    
    return hadiths;
  }
  
  matchesSearch(hadith, query, gradeFilter) {
    // Check grade filter
    if (gradeFilter !== 'all' && hadith.grade?.toLowerCase() !== gradeFilter.toLowerCase()) {
      return false;
    }
    
    // Search in text
    const searchText = (hadith.text_english + ' ' + (hadith.text_simple || '')).toLowerCase();
    const queryTerms = query.toLowerCase().split(' ');
    
    return queryTerms.every(term => searchText.includes(term));
  }
  
  async getRandomHadith(collection = 'all') {
    await this.init();
    
    const results = [];
    const collections = collection === 'all' 
      ? ['bukhari', 'muslim'] 
      : [collection];
    
    for (const col of collections) {
      const collectionData = this.hadithData[col];
      if (collectionData) {
        const hadiths = this.extractAllHadiths(collectionData);
        results.push(...hadiths.map(h => ({ ...h, collection: col })));
      }
    }
    
    if (results.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * results.length);
    return results[randomIndex];
  }
  
  async getHadithByChapter(collection, chapter, limit = 50) {
    await this.init();
    
    const collectionData = this.hadithData[collection];
    if (!collectionData || !collectionData.chapters) return [];
    
    const hadiths = collectionData.chapters[chapter] || [];
    return hadiths.slice(0, limit);
  }
  
  async getHadithGradings() {
    await this.init();
    return this.hadithData.gradings;
  }
}

module.exports = new HadithService();