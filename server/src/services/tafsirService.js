const dataLoader = require('../data/utils/dataLoader');

class TafsirService {
  constructor() {
    this.tafsirData = null;
  }
  
  async init() {
    if (!this.tafsirData) {
      await dataLoader.loadAll();
      this.tafsirData = dataLoader.data.quran.tafsir;
    }
  }
  
  async getTafsir(surah, verse) {
    await this.init();
    
    if (!this.tafsirData || !this.tafsirData.tafsir) return null;
    
    return this.tafsirData.tafsir.find(t => 
      t.surah === surah && t.verse === verse
    );
  }
  
  async getTafsirBySurah(surah) {
    await this.init();
    
    if (!this.tafsirData || !this.tafsirData.tafsir) return [];
    
    return this.tafsirData.tafsir.filter(t => t.surah === surah);
  }
  
  async explainVerse(surah, verse, detail = 'simple') {
    const tafsir = await this.getTafsir(surah, verse);
    
    if (!tafsir) {
      return {
        found: false,
        message: 'Tafsir not available for this verse yet'
      };
    }
    
    if (detail === 'simple') {
      return {
        found: true,
        explanation: tafsir.explanation_english,
        keyTakeaway: tafsir.key_takeaway
      };
    } else {
      return {
        found: true,
        explanation: tafsir.explanation_english,
        arabicExplanation: tafsir.explanation_arabic,
        keyTakeaway: tafsir.key_takeaway,
        virtues: tafsir.virtues || []
      };
    }
  }
}

module.exports = new TafsirService();