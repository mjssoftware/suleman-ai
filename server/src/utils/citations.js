class CitationManager {
  constructor() {
    this.citationStyles = {
      quran: this.formatQuranCitation,
      hadith: this.formatHadithCitation,
      tafsir: this.formatTafsirCitation,
      scholar: this.formatScholarCitation
    };
  }
  
  // Format Quran citation
  formatQuranCitation(surah, verse, translation = 'Sahih International') {
    return {
      text: `Quran ${surah}:${verse}`,
      html: `<cite class="quran-citation">📖 Qur'an <strong>${surah}:${verse}</strong> (${translation})</cite>`,
      markdown: `📖 **Qur'an ${surah}:${verse}** (${translation})`,
      reference: `${surah}:${verse}`
    };
  }
  
  // Format Hadith citation
  formatHadithCitation(collection, number, grade = 'Sahih') {
    const collections = {
      bukhari: 'Sahih al-Bukhari',
      muslim: 'Sahih Muslim',
      tirmidhi: 'Jami at-Tirmidhi',
      abudawud: 'Sunan Abi Dawud'
    };
    
    const collectionName = collections[collection] || collection;
    
    return {
      text: `${collectionName} ${number} (${grade})`,
      html: `<cite class="hadith-citation">📜 <strong>${collectionName}</strong> ${number} <span class="grade">(${grade})</span></cite>`,
      markdown: `📜 **${collectionName} ${number}** (${grade})`,
      reference: `${collection}/${number}`,
      grade: grade
    };
  }
  
  // Format Tafsir citation
  formatTafsirCitation(surah, verse, scholar = 'Ibn Kathir') {
    return {
      text: `Tafsir ${scholar} - ${surah}:${verse}`,
      html: `<cite class="tafsir-citation">📚 Tafsir <strong>${scholar}</strong> on ${surah}:${verse}</cite>`,
      markdown: `📚 **Tafsir ${scholar}** on ${surah}:${verse}`
    };
  }
  
  // Format scholar citation
  formatScholarCitation(scholar, ruling, date) {
    return {
      text: `${scholar} - ${ruling}`,
      html: `<cite class="scholar-citation">👳 ${scholar}: <em>${ruling}</em> (${date})</cite>`,
      markdown: `👳 **${scholar}**: *${ruling}* (${date})`
    };
  }
  
  // Generate citation for AI response
  generateCitation(sourceType, sourceData) {
    const formatter = this.citationStyles[sourceType];
    if (formatter) {
      return formatter.apply(this, sourceData);
    }
    return null;
  }
  
  // Group multiple citations
  groupCitations(citations) {
    const grouped = {
      quran: [],
      hadith: [],
      tafsir: [],
      scholar: []
    };
    
    citations.forEach(citation => {
      if (grouped[citation.type]) {
        grouped[citation.type].push(citation);
      }
    });
    
    return grouped;
  }
  
  // Verify citation authenticity
  verifyCitation(citation) {
    // Check if Quran reference is valid
    if (citation.type === 'quran') {
      const [surah, verse] = citation.reference.split(':');
      const surahNum = parseInt(surah);
      const verseNum = parseInt(verse);
      
      // Basic validation
      if (isNaN(surahNum) || isNaN(verseNum)) return false;
      if (surahNum < 1 || surahNum > 114) return false;
      if (verseNum < 1) return false;
      
      // Additional verse limits per surah would be checked here
      return true;
    }
    
    // Check if Hadith reference is valid
    if (citation.type === 'hadith') {
      const validCollections = ['bukhari', 'muslim', 'tirmidhi', 'abudawud'];
      if (!validCollections.includes(citation.collection)) return false;
      if (citation.number < 1) return false;
      return true;
    }
    
    return true;
  }
  
  // Get citation priority (for sorting)
  getCitationPriority(citation) {
    const priorities = {
      quran: 1,
      mutawatir: 2,
      sahih: 3,
      hasan: 4,
      daif: 5,
      tafsir: 6,
      scholar: 7
    };
    
    return priorities[citation.type] || 99;
  }
  
  // Sort citations by authenticity
  sortCitationsByAuthenticity(citations) {
    return citations.sort((a, b) => {
      const priorityA = this.getCitationPriority(a);
      const priorityB = this.getCitationPriority(b);
      return priorityA - priorityB;
    });
  }
}

module.exports = new CitationManager();