class API {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': getUserId(),
                'X-Session-Id': getSessionId()
            }
        };
        
        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Chat endpoints
    async sendMessage(message, context = {}) {
        return this.request('/chat/send', {
            method: 'POST',
            body: JSON.stringify({
                message,
                userId: CONFIG.DEFAULT_USER_ID,
                sessionId: CONFIG.DEFAULT_SESSION_ID,
                ...context
            })
        });
    }
    
    async getChatHistory(limit = 50, page = 1) {
        return this.request(`/chat/history?userId=${CONFIG.DEFAULT_USER_ID}&limit=${limit}&page=${page}`);
    }
    
    async getConversation(sessionId) {
        return this.request(`/chat/conversation/${sessionId}?userId=${CONFIG.DEFAULT_USER_ID}`);
    }
    
    async deleteConversation(sessionId) {
        return this.request(`/chat/conversation/${sessionId}`, {
            method: 'DELETE',
            body: JSON.stringify({ userId: CONFIG.DEFAULT_USER_ID })
        });
    }
    
    async submitFeedback(feedback) {
        return this.request('/chat/feedback', {
            method: 'POST',
            body: JSON.stringify({
                userId: CONFIG.DEFAULT_USER_ID,
                ...feedback
            })
        });
    }
    
    // Quran endpoints
    async getVerse(surah, verse, language = 'english') {
        return this.request(`/quran/verse/${surah}/${verse}?language=${language}`);
    }
    
    async searchQuran(query, limit = 20, page = 1) {
        return this.request(`/quran/search?q=${encodeURIComponent(query)}&limit=${limit}&page=${page}`);
    }
    
    async getRandomVerse() {
        return this.request('/quran/random');
    }
    
    // Hadith endpoints
    async getHadith(collection, id) {
        return this.request(`/hadith/${collection}/${id}`);
    }
    
    async searchHadith(query, collection = 'all', grade = 'all', limit = 20) {
        return this.request(`/hadith/search?q=${encodeURIComponent(query)}&collection=${collection}&grade=${grade}&limit=${limit}`);
    }
    
    async getRandomHadith(collection = 'all') {
        return this.request(`/hadith/random?collection=${collection}`);
    }
    
    // QA endpoints
    async askQuestion(question, context = {}) {
        return this.request('/qa/ask', {
            method: 'POST',
            body: JSON.stringify({
                question,
                userId: CONFIG.DEFAULT_USER_ID,
                context
            })
        });
    }
}

const api = new API();