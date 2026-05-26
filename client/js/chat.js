class ChatUI {
    constructor() {
        this.messagesArea = document.getElementById('messagesArea');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.currentSessionId = CONFIG.DEFAULT_SESSION_ID;
        this.isTyping = false;
        this.messageQueue = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadChatHistory();
        this.setupAutoResize();
    }
    
    setupEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Suggestion chips
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const question = chip.dataset.question;
                if (question) {
                    this.messageInput.value = question;
                    this.sendMessage();
                }
            });
        });
    }
    
    setupAutoResize() {
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        });
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        
        // Add user message to UI
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTyping();
        this.isTyping = true;
        
        try {
            const response = await api.sendMessage(message, {
                madhhab: document.getElementById('madhhabSelect')?.value || 'general',
                language: document.getElementById('languageSelect')?.value || 'en'
            });
            
            this.hideTyping();
            
            // Add AI response
            this.addMessage(response.response, 'assistant', response.citations);
            
            // Save session ID
            if (response.sessionId && response.sessionId !== this.currentSessionId) {
                this.currentSessionId = response.sessionId;
                sessionStorage.setItem('suleman_session_id', response.sessionId);
            }
            
        } catch (error) {
            this.hideTyping();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant', null, true);
            console.error('Send message error:', error);
        }
        
        this.isTyping = false;
        this.scrollToBottom();
    }
    
    addMessage(content, role, citations = null, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role} ${isError ? 'error' : ''}`;
        messageDiv.style.animation = 'fadeIn 0.3s ease';
        
        const avatar = role === 'user' ? 
            '<div class="avatar user-avatar"><i class="fas fa-user"></i></div>' :
            '<div class="avatar ai-avatar"><i class="fas fa-robot"></i></div>';
        
        let citationsHtml = '';
        if (citations && citations.length > 0) {
            citationsHtml = '<div class="citations"><div class="citations-title"><i class="fas fa-book"></i> References:</div><ul>';
            citations.forEach(citation => {
                citationsHtml += `<li>
                    <i class="fas ${citation.type === 'quran' ? 'fa-book-quran' : 'fa-hadith'}"></i>
                    <strong>${citation.reference}</strong>
                    <span class="citation-grade">${citation.grade || ''}</span>
                    <div class="citation-text">${citation.text}</div>
                </li>`;
            });
            citationsHtml += '</ul></div>';
        }
        
        const errorClass = isError ? 'error-message' : '';
        messageDiv.innerHTML = `
            ${avatar}
            <div class="message-content">
                <div class="message-bubble ${errorClass}">
                    ${this.formatMessage(content)}
                </div>
                ${citationsHtml}
                ${!isError && role === 'assistant' ? this.addFeedbackButtons() : ''}
            </div>
        `;
        
        this.messagesArea.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Remove welcome message if exists
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg && this.messagesArea.children.length > 1) {
            welcomeMsg.remove();
        }
        
        return messageDiv;
    }
    
    formatMessage(content) {
        // Convert markdown-like syntax
        let formatted = content;
        
        // Bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Quran references
        formatted = formatted.replace(/(\d+):(\d+)/g, '<span class="quran-ref">$1:$2</span>');
        
        // Hadith references
        formatted = formatted.replace(/(Bukhari|Muslim|Tirmidhi)\s+(\d+)/gi, '<span class="hadith-ref">$1 $2</span>');
        
        return formatted;
    }
    
    addFeedbackButtons() {
        return `
            <div class="feedback-buttons">
                <button class="feedback-btn helpful" onclick="window.chatUI?.submitFeedback(this, true)">
                    <i class="fas fa-thumbs-up"></i> Helpful
                </button>
                <button class="feedback-btn not-helpful" onclick="window.chatUI?.submitFeedback(this, false)">
                    <i class="fas fa-thumbs-down"></i> Not Helpful
                </button>
            </div>
        `;
    }
    
    async submitFeedback(button, helpful) {
        const messageDiv = button.closest('.message');
        const messageContent = messageDiv.querySelector('.message-bubble').innerText;
        const parentMessage = messageDiv.previousElementSibling;
        const userQuestion = parentMessage?.querySelector('.message-bubble')?.innerText || '';
        
        button.disabled = true;
        button.innerHTML = helpful ? '<i class="fas fa-check"></i> Thanks!' : '<i class="fas fa-check"></i> Noted';
        
        try {
            await api.submitFeedback({
                sessionId: this.currentSessionId,
                messageId: Date.now().toString(),
                userQuestion: userQuestion,
                aiResponse: messageContent,
                rating: helpful ? 5 : 1,
                helpful: helpful
            });
        } catch (error) {
            console.error('Feedback error:', error);
        }
    }
    
    showTyping() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }
    
    hideTyping() {
        this.typingIndicator.style.display = 'none';
    }
    
    scrollToBottom() {
        this.messagesArea.scrollTo({
            top: this.messagesArea.scrollHeight,
            behavior: CONFIG.UI.SCROLL_SMOOTHING ? 'smooth' : 'auto'
        });
    }
    
    async loadChatHistory() {
        try {
            const history = await api.getChatHistory(10, 1);
            // Load previous conversations into sidebar
            this.updateHistorySidebar(history.data);
        } catch (error) {
            console.error('Load history error:', error);
        }
    }
    
    updateHistorySidebar(histories) {
        const historyContainer = document.getElementById('chatHistory');
        if (!historyContainer) return;
        
        historyContainer.innerHTML = '';
        histories.forEach(history => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <i class="fas fa-comment"></i>
                <span>${history.title || 'Conversation'}</span>
                <small>${new Date(history.updatedAt).toLocaleDateString()}</small>
            `;
            historyItem.onclick = () => this.loadConversation(history.sessionId);
            historyContainer.appendChild(historyItem);
        });
    }
    
    async loadConversation(sessionId) {
        try {
            const conversation = await api.getConversation(sessionId);
            this.messagesArea.innerHTML = '';
            
            conversation.data.messages.forEach(msg => {
                this.addMessage(msg.content, msg.role, msg.citations);
            });
            
            this.currentSessionId = sessionId;
            sessionStorage.setItem('suleman_session_id', sessionId);
        } catch (error) {
            console.error('Load conversation error:', error);
        }
    }
    
    clearChat() {
        this.messagesArea.innerHTML = '';
        this.currentSessionId = getSessionId();
        this.addWelcomeMessage();
    }
    
    addWelcomeMessage() {
        const welcomeHtml = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-hand-peace"></i>
                </div>
                <h2>Assalamu Alaikum!</h2>
                <p>I'm Suleman AI, your Islamic assistant. How can I help you today?</p>
            </div>
        `;
        this.messagesArea.innerHTML = welcomeHtml;
    }
}

// Initialize chat
const chatUI = new ChatUI();
window.chatUI = chatUI;