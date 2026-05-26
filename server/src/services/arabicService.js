class ArabicService {
  constructor() {
    this.arabicDiacritics = /[\u064B-\u065F\u0670]/g;
    this.arabicLetters = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
    
    // Transliteration mapping
    this.transliterationMap = {
      'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'aa',
      'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
      'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
      'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
      'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
      'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
      'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
      'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'h',
      'ى': 'a', 'ء': 'a', 'ؤ': 'w', 'ئ': 'y'
    };
  }
  
  // Remove diacritics from Arabic text
  removeDiacritics(text) {
    if (!text) return '';
    return text.replace(this.arabicDiacritics, '');
  }
  
  // Check if text contains Arabic
  containsArabic(text) {
    return /[\u0600-\u06FF]/.test(text);
  }
  
  // Simple transliteration to Latin
  transliterate(text) {
    if (!text) return '';
    
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      result += this.transliterationMap[char] || char;
    }
    return result;
  }
  
  // Normalize Arabic text (remove diacritics and normalize alifs)
  normalizeArabic(text) {
    if (!text) return '';
    
    let normalized = this.removeDiacritics(text);
    
    // Normalize different alif forms
    normalized = normalized.replace(/[أإآ]/g, 'ا');
    
    // Normalize teh marbuta
    normalized = normalized.replace(/ة/g, 'ه');
    
    // Normalize alef maksura
    normalized = normalized.replace(/ى/g, 'ي');
    
    return normalized;
  }
  
  // Get Arabic root word (basic)
  getArabicRoot(word) {
    // Remove common prefixes
    let cleaned = word.replace(/^[والفبك]/g, '');
    // Remove common suffixes
    cleaned = cleaned.replace(/[ونات]$/g, '');
    
    // Extract 3-4 letter root
    const rootLetters = [];
    for (const char of cleaned) {
      if (this.arabicLetters.includes(char) && !rootLetters.includes(char)) {
        rootLetters.push(char);
        if (rootLetters.length === 3) break;
      }
    }
    
    return rootLetters.join('');
  }
  
  // Count Arabic words
  countArabicWords(text) {
    const words = text.split(/\s+/);
    let count = 0;
    for (const word of words) {
      if (this.containsArabic(word)) count++;
    }
    return count;
  }
  
  // Extract Quranic verses reference from text
  extractQuranReferences(text) {
    const patterns = [
      /(?:سورة|Surah)\s+(\w+)\s*(?::|آية|verse)\s*(\d+)/i,
      /(\d+):(\d+)/,
      /(?:الفاتحة|البقرة|آل عمران)[^0-9]*(\d+)/i
    ];
    
    const references = [];
    for (const pattern of patterns) {
      const matches = text.matchAll(new RegExp(pattern, 'g'));
      for (const match of matches) {
        references.push({
          surah: match[1],
          verse: match[2],
          fullMatch: match[0]
        });
      }
    }
    
    return references;
  }
  
  // Extract Hadith references from text
  extractHadithReferences(text) {
    const patterns = [
      /(?:البخاري|Bukhari)\s+(\d+)/i,
      /(?:مسلم|Muslim)\s+(\d+)/i,
      /(?:رواه|narrated by)\s+(\w+)/i
    ];
    
    const references = [];
    for (const pattern of patterns) {
      const matches = text.matchAll(new RegExp(pattern, 'g'));
      for (const match of matches) {
        references.push({
          collection: match[1] === 'البخاري' ? 'bukhari' : 'muslim',
          number: match[2] || match[1],
          fullMatch: match[0]
        });
      }
    }
    
    return references;
  }
  
  // Check if Arabic text is valid (has proper characters)
  isValidArabic(text) {
    const validPattern = /^[\u0600-\u06FF\s\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/;
    return validPattern.test(text);
  }
  
  // Convert Arabic numbers to English
  arabicToEnglishNumbers(text) {
    const arabicNumbers = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    
    let result = text;
    for (const [arabic, english] of Object.entries(arabicNumbers)) {
      result = result.replace(new RegExp(arabic, 'g'), english);
    }
    return result;
  }
  
  // Convert English numbers to Arabic
  englishToArabicNumbers(text) {
    const englishNumbers = {
      '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
      '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
    };
    
    let result = text;
    for (const [english, arabic] of Object.entries(englishNumbers)) {
      result = result.replace(new RegExp(english, 'g'), arabic);
    }
    return result;
  }
  
  // Split Arabic text into sentences
  splitIntoSentences(text) {
    // Arabic sentence boundaries: period, question mark, exclamation
    const boundaries = /[.?!\u060C\u061B\u061F]\s+/;
    const sentences = text.split(boundaries);
    return sentences.filter(s => s.trim().length > 0);
  }
  
  // Get Arabic text direction info
  getTextDirection(text) {
    if (this.containsArabic(text)) {
      return { direction: 'rtl', alignment: 'right' };
    }
    return { direction: 'ltr', alignment: 'left' };
  }
  
  // Join Arabic words with proper connectors
  joinArabicPhrase(words) {
    // In Arabic, 'و' (and) is prefixed without space
    return words.map((word, index) => {
      if (word === 'و' && index > 0) {
        return word;
      }
      return index === 0 ? word : ` ${word}`;
    }).join('');
  }
}

module.exports = new ArabicService();