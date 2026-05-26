class Formatters {
  // Format Quran reference
  formatQuranReference(surah, verse, translation = 'en') {
    const surahNames = {
      1: 'Al-Fatihah', 2: 'Al-Baqarah', 3: 'Aal-Imran', 4: 'An-Nisa',
      5: 'Al-Maidah', 6: 'Al-Anam', 7: 'Al-Araf', 8: 'Al-Anfal',
      9: 'At-Tawbah', 10: 'Yunus', 11: 'Hud', 12: 'Yusuf',
      // Add more surah names
    };
    
    const surahName = surahNames[surah] || `Surah ${surah}`;
    return `${surahName} [${surah}:${verse}]`;
  }
  
  // Format Hadith reference
  formatHadithReference(collection, number) {
    const collections = {
      bukhari: 'Sahih al-Bukhari',
      muslim: 'Sahih Muslim',
      tirmidhi: 'Jami at-Tirmidhi',
      abudawud: 'Sunan Abi Dawud',
      nasai: 'Sunan an-Nasai',
      ibnmajah: 'Sunan Ibn Majah'
    };
    
    const collectionName = collections[collection] || collection;
    return `${collectionName} ${number}`;
  }
  
  // Format Arabic numbers
  formatArabicNumber(number) {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return number.toString().replace(/\d/g, d => arabicDigits[parseInt(d)]);
  }
  
  // Format date to Hijri (Islamic calendar)
  formatHijriDate(gregorianDate = new Date()) {
    // Simplified - would need proper calculation
    const hijriMonths = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaaban',
      'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
    ];
    
    // Approximate conversion (simplified)
    const hijriYear = Math.floor(gregorianDate.getFullYear() - 622);
    const hijriMonth = gregorianDate.getMonth();
    
    return `${hijriMonths[hijriMonth]} ${hijriYear} AH`;
  }
  
  // Format prayer time
  formatPrayerTime(time) {
    if (!time) return '';
    
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  
  // Format duration (e.g., "3 minutes ago")
  formatDuration(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    
    return 'just now';
  }
  
  // Format response with citations
  formatResponseWithCitations(answer, citations) {
    let formattedAnswer = answer;
    
    if (citations && citations.length > 0) {
      formattedAnswer += '\n\n📚 **References:**\n';
      citations.forEach((citation, index) => {
        const icon = citation.type === 'quran' ? '📖' : '📜';
        formattedAnswer += `${icon} ${citation.reference}\n`;
        if (citation.text) {
          formattedAnswer += `   "${citation.text.substring(0, 100)}..."\n`;
        }
      });
    }
    
    return formattedAnswer;
  }
  
  // Truncate text with ellipsis
  truncateText(text, maxLength = 200) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }
  
  // Capitalize first letter
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  
  // Convert Arabic transliteration to Arabic script (basic)
  transliterateToArabic(text) {
    const transliterationMap = {
      'bismillah': 'بسم الله',
      'alhamdulillah': 'الحمد لله',
      'mashaAllah': 'ما شاء الله',
      'inshaAllah': 'إن شاء الله',
      'subhanAllah': 'سبحان الله',
      'Allahu Akbar': 'الله أكبر',
      'astaghfirullah': 'أستغفر الله'
    };
    
    let result = text;
    for (const [key, value] of Object.entries(transliterationMap)) {
      const regex = new RegExp(key, 'gi');
      result = result.replace(regex, value);
    }
    
    return result;
  }
}

module.exports = new Formatters();