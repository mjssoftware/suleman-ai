const dataLoader = require('../data/utils/dataLoader');
const quranService = require('./quranService');
const hadithService = require('./hadithService');
const tafsirService = require('./tafsirService');

class IslamicDataService {
  constructor() {
    this.initialized = false;
  }
  
  async init() {
    if (!this.initialized) {
      await dataLoader.loadAll();
      await quranService.init();
      await hadithService.init();
      await tafsirService.init();
      this.initialized = true;
    }
  }
  
  async getVerse(surah, verse, language = 'english') {
    await this.init();
    return await quranService.getVerse(surah, verse, language);
  }
  
  async getSurah(surahId, language = 'english') {
    await this.init();
    return await quranService.getSurah(surahId, language);
  }
  
  async searchInQuran(query, limit = 10, page = 1) {
    await this.init();
    return await quranService.search(query, limit, page);
  }
  
  async getRandomVerse() {
    await this.init();
    return await quranService.getRandomVerse();
  }
  
  async getVersesByTopic(topic) {
    await this.init();
    return await quranService.getVersesByTopic(topic);
  }
  
  async getHadith(collection, id) {
    await this.init();
    return await hadithService.getHadith(collection, id);
  }
  
  async searchInHadith(query, collection = 'all', grade = 'all', limit = 20, page = 1) {
    await this.init();
    return await hadithService.search(query, collection, grade, limit, page);
  }
  
  async getRandomHadith(collection = 'all') {
    await this.init();
    return await hadithService.getRandomHadith(collection);
  }
  
  async getHadithByChapter(collection, chapter, limit = 50) {
    await this.init();
    return await hadithService.getHadithByChapter(collection, chapter, limit);
  }
  
  async getHadithGradings() {
    await this.init();
    return await hadithService.getHadithGradings();
  }
  
  async getTafsir(surah, verse) {
    await this.init();
    return await tafsirService.getTafsir(surah, verse);
  }
  
  async searchIslamicContent(query) {
    await this.init();
    
    const [quranResults, hadithResults, duaResults] = await Promise.all([
      this.searchInQuran(query, 5, 1),
      this.searchInHadith(query, 'all', 'all', 5, 1),
      this.searchDuas(query)
    ]);
    
    return {
      quran: quranResults.results || [],
      hadith: hadithResults.data || [],
      duas: duaResults || []
    };
  }
  
  async searchDuas(query) {
    await this.init();
    const duas = dataLoader.searchDuas(query);
    return duas;
  }
  
  async getDailyDua(category, id) {
    await this.init();
    return dataLoader.getDailyDua(category, id);
  }
  
  async getAllDuasByCategory(category) {
    await this.init();
    return dataLoader.getAllDuasByCategory(category);
  }
  
  async getQuranData() {
    await this.init();
    return dataLoader.data.quran;
  }
  
  async getHadithCollection(collection) {
    await this.init();
    return dataLoader.data.hadith[collection];
  }
}

module.exports = new IslamicDataService();