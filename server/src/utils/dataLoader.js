const fs = require('fs').promises;
const path = require('path');

class IslamicDataLoader {
  constructor() {
    this.data = {
      quran: { arabic: null, english: null, tafsir: null },
      hadith: { bukhari: null, muslim: null, gradings: null },
      duas: { daily: null, quranic: null }
    };
    this.loaded = false;
  }

  async loadAll() {
    try {
      console.log('Loading Islamic datasets...');
      
      // Load Quran
      this.data.quran.arabic = await this.loadJSON('quran/quran-arabic.json');
      this.data.quran.english = await this.loadJSON('quran/quran-english.json');
      this.data.quran.tafsir = await this.loadJSON('quran/tafsir/short-tafsir.json');
      
      // Load Hadith
      this.data.hadith.bukhari = await this.loadJSON('hadith/bukhari.json');
      this.data.hadith.muslim = await this.loadJSON('hadith/muslim.json');
      this.data.hadith.gradings = await this.loadJSON('hadith/gradings.json');
      
      // Load Duas
      this.data.duas.daily = await this.loadJSON('duas/daily-duas.json');
      this.data.duas.quranic = await this.loadJSON('duas/quranic-duas.json');
      
      this.loaded = true;
      console.log('✅ All Islamic datasets loaded successfully');
      return this.data;
    } catch (error) {
      console.error('Error loading Islamic datasets:', error);
      throw error;
    }
  }

  async loadJSON(filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    try {
      const data = await fs.readFile(fullPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`Warning: Could not load ${filePath}`, error.message);
      return null;
    }
  }

  // Helper methods for Quran
  getVerse(surah, verse) {
    if (!this.data.quran.english) return null;
    const surahData = this.data.quran.english.surahs.find(s => s.id === surah);
    if (!surahData) return null;
    return surahData.verses.find(v => v.verse_id === verse);
  }

  getSurah(surahId) {
    if (!this.data.quran.english) return null;
    return this.data.quran.english.surahs.find(s => s.id === surahId);
  }

  // Helper methods for Hadith
  getHadith(collection, id) {
    if (!this.data.hadith[collection]) return null;
    const collectionData = this.data.hadith[collection];
    return collectionData.hadiths?.find(h => h.id === id) || 
           this.searchHadith(collection, id);
  }

  searchHadith(collection, keyword) {
    if (!this.data.hadith[collection]) return [];
    const collectionData = this.data.hadith[collection];
    const results = [];
    
    // Search in chapters
    if (collectionData.chapters) {
      for (const chapter in collectionData.chapters) {
        const hadiths = collectionData.chapters[chapter];
        results.push(...hadiths.filter(h => 
          h.text_english.toLowerCase().includes(keyword.toLowerCase()) ||
          h.keywords?.some(k => k.includes(keyword.toLowerCase()))
        ));
      }
    }
    
    return results;
  }

  // Helper methods for Duas
  getDailyDua(category, id) {
    if (!this.data.duas.daily) return null;
    const categoryData = this.data.duas.daily.categories[category];
    if (!categoryData) return null;
    return categoryData.find(d => d.id === id);
  }

  getAllDuasByCategory(category) {
    if (!this.data.duas.daily) return [];
    return this.data.duas.daily.categories[category] || [];
  }

  searchDuas(keyword) {
    if (!this.data.duas.daily) return [];
    const results = [];
    for (const category in this.data.duas.daily.categories) {
      const duas = this.data.duas.daily.categories[category];
      const matches = duas.filter(d => 
        d.name?.toLowerCase().includes(keyword.toLowerCase()) ||
        d.translation.toLowerCase().includes(keyword.toLowerCase()) ||
        d.transliteration.toLowerCase().includes(keyword.toLowerCase())
      );
      results.push(...matches.map(d => ({ ...d, category })));
    }
    return results;
  }

  // Search across all data
  async searchIslamicContent(query) {
    const results = {
      quran: [],
      hadith: [],
      duas: []
    };

    // Search in Quran
    if (this.data.quran.english) {
      for (const surah of this.data.quran.english.surahs) {
        const matches = surah.verses.filter(v => 
          v.text.toLowerCase().includes(query.toLowerCase())
        );
        if (matches.length > 0) {
          results.quran.push({ surah: surah.name, verses: matches });
        }
      }
    }

    // Search in Hadith
    results.hadith = this.searchHadith('bukhari', query);
    results.hadith.push(...this.searchHadith('muslim', query));

    // Search in Duas
    results.duas = this.searchDuas(query);

    return results;
  }
}

module.exports = new IslamicDataLoader();