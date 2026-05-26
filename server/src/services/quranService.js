const dataLoader = require('../data/utils/dataLoader');

class QuranService {
  constructor() {
    this.quranData = null;
  }
  
  async init() {
    if (!this.quranData) {
      await dataLoader.loadAll();
      this.quranData = dataLoader.data.quran;
    }
  }
  
  async getVerse(surah, verse, language = 'english') {
    await this.init();
    
    const surahData = this.quranData.english?.surahs?.find(s => s.id === surah);
    if (!surahData) return null;
    
    const verseData = surahData.verses?.find(v => v.verse_id === verse);
    if (!verseData) return null;
    
    const result = {
      surah: surah,
      surahName: surahData.name,
      verse: verse,
      text: verseData.text,
      language: language
    };
    
    // Add Arabic text if requested
    if (language === 'both' || language === 'arabic') {
      const arabicSurah = this.quranData.arabic?.surahs?.find(s => s.id === surah);
      if (arabicSurah && arabicSurah.verses) {
        const arabicVerse = arabicSurah.verses.find(v => v.verse_id === verse);
        if (arabicVerse) {
          result.arabic = arabicVerse.verse_arabic;
          result.transliteration = arabicVerse.verse_simple;
        }
      }
    }
    
    return result;
  }
  
  async getSurah(surahId, language = 'english') {
    await this.init();
    
    const surah = this.quranData[language]?.surahs?.find(s => s.id === surahId);
    if (!surah) return null;
    
    return surah;
  }
  
  async search(query, limit = 10, page = 1) {
    await this.init();
    
    const results = [];
    const skip = (page - 1) * limit;
    
    for (const surah of this.quranData.english?.surahs || []) {
      const matches = surah.verses.filter(verse =>
        verse.text.toLowerCase().includes(query.toLowerCase())
      );
      
      for (const match of matches) {
        results.push({
          surah: surah.id,
          surahName: surah.name,
          verse: match.verse_id,
          text: match.text,
          relevance: this.calculateRelevance(query, match.text)
        });
      }
    }
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    return {
      results: results.slice(skip, skip + limit),
      total: results.length
    };
  }
  
  calculateRelevance(query, text) {
    const queryTerms = query.toLowerCase().split(' ');
    const textLower = text.toLowerCase();
    
    let matches = 0;
    for (const term of queryTerms) {
      if (textLower.includes(term)) matches++;
    }
    
    return matches / queryTerms.length;
  }
  
  async getRandomVerse() {
    await this.init();
    
    const randomSurah = Math.floor(Math.random() * 114) + 1;
    const surah = await this.getSurah(randomSurah);
    
    if (surah && surah.verses) {
      const randomVerse = Math.floor(Math.random() * surah.verses.length);
      return await this.getVerse(randomSurah, randomVerse + 1);
    }
    
    return null;
  }
  
  async getVersesByTopic(topic) {
    await this.init();
    
    const topicKeywords = this.getTopicKeywords(topic);
    const verses = [];
    
    for (const surah of this.quranData.english?.surahs || []) {
      for (const verse of surah.verses) {
        const verseText = verse.text.toLowerCase();
        if (topicKeywords.some(keyword => verseText.includes(keyword))) {
          verses.push({
            surah: surah.id,
            surahName: surah.name,
            verse: verse.verse_id,
            text: verse.text
          });
        }
      }
    }
    
    return verses.slice(0, 10);
  }
  
  getTopicKeywords(topic) {
    const topics = {
      'patience': ['patient', 'patience', 'endurance', 'perseverance'],
      'mercy': ['mercy', 'merciful', 'forgiveness', 'compassion'],
      'justice': ['justice', 'just', 'fair', 'equity'],
      'charity': ['charity', 'give', 'spend', 'donate', 'zakat'],
      'prayer': ['prayer', 'pray', 'salah', 'worship']
    };
    
    return topics[topic.toLowerCase()] || [topic.toLowerCase()];
  }
}

module.exports = new QuranService();