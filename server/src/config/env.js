require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/suleman-ai',
  HF_API_TOKEN: process.env.HF_API_TOKEN,
  HF_MODEL: process.env.HF_MODEL || 'google/flan-t5-large', // or 'meta-llama/Llama-2-7b-chat-hf'
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // limit each IP to 100 requests per windowMs
  CACHE_TTL: 3600 // 1 hour
};