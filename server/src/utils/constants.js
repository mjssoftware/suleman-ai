module.exports = {
  // Islamic months
  ISLAMIC_MONTHS: [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaaban',
    'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
  ],
  
  // Prayer names
  PRAYERS: {
    FAJR: { name: 'Fajr', rakats: 2, time: 'Dawn' },
    DHUHR: { name: 'Dhuhr', rakats: 4, time: 'Midday' },
    ASR: { name: 'Asr', rakats: 4, time: 'Afternoon' },
    MAGHRIB: { name: 'Maghrib', rakats: 3, time: 'Sunset' },
    ISHA: { name: 'Isha', rakats: 4, time: 'Night' }
  },
  
  // Zakat rates
  ZAKAT_RATES: {
    GOLD: 0.025, // 2.5%
    SILVER: 0.025,
    CASH: 0.025,
    BUSINESS: 0.025,
    AGRICULTURE: 0.10 // 10% for rain-irrigated, 5% for irrigated
  },
  
  // Nisab thresholds (approx in USD)
  NISAB: {
    GOLD: 5000, // 87.48 grams of gold
    SILVER: 400  // 612.36 grams of silver
  },
  
  // Major sins (Al-Kaba'ir)
  MAJOR_SINS: [
    'Shirk (associating partners with Allah)',
    'Murder',
    'Adultery/Fornication',
    'Riba (usury/interest)',
    'Orphan s property consumption',
    'Fleeing from battle',
    'Slandering chaste women',
    'Magic/Sorcery',
    'Alcohol consumption',
    'Gambling'
  ],
  
  // Names of Allah (99)
  ALLAH_NAMES: [
    'Ar-Rahman (The Most Gracious)',
    'Ar-Rahim (The Most Merciful)',
    'Al-Malik (The King)',
    'Al-Quddus (The Holy)',
    'As-Salam (The Peace)',
    // ... add all 99 names
  ],
  
  // Hadith collections priority
  HADITH_PRIORITY: {
    'bukhari': 1,
    'muslim': 2,
    'tirmidhi': 3,
    'abudawud': 4,
    'nasai': 5,
    'ibnmajah': 6
  },
  
  // API response messages
  RESPONSE_MESSAGES: {
    SUCCESS: 'Operation completed successfully',
    ERROR: 'An error occurred',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    RATE_LIMIT: 'Too many requests, please try again later'
  },
  
  // Chat categories
  CHAT_CATEGORIES: [
    'aqeedah', 'fiqh', 'quran', 'hadith', 
    'seerah', 'duas', 'general', 'advice'
  ]
};