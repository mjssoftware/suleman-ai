/**
 * Suleman AI - Main Application
 */

class SulemanApp {
    constructor() {
        this.chat = null;
        this.currentTheme = storage.get('theme', 'light');
        this.currentFontSize = storage.get('fontSize', 'medium');
        this.isMenuOpen = false;
        
        this.init();
    }
    
    async init() {
        // Show loading overlay
        this.showLoading(true);
        
        try {
            // Initialize components
            this.initTheme();
            this.initFontSize();
            this.initEventListeners();
            
            // Initialize chat
            this.chat = new SulemanChat();
            await this.chat.init();
            
            // Hide loading overlay
            this.showLoading(false);
            
            // Show welcome message
            this.chat.showWelcome();
            
        } catch (error) {
            console.error('App initialization error:', error);
            showToast('Failed to initialize application', 'error');
            this.showLoading(false);
        }
    }
    
    initTheme() {
        const theme = this.currentTheme;
        
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        } else if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.body.setAttribute('data-theme', 'dark');
            }
        } else {
            document.body.removeAttribute('data-theme');
        }
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = theme === 'dark' ? 'fa-sun' : 'fa-moon';
            themeToggle.innerHTML = `<i class="fas ${icon}"></i>`;
        }
    }
    
    initFontSize() {
        const sizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };
        
        document.documentElement.style.fontSize = sizes[this.currentFontSize] || '16px';
        
        // Update active button
        document.querySelectorAll('.font-size-btn').forEach(btn => {
            if (btn.dataset.size === this.currentFontSize) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    initEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Menu toggle for mobile
        const menuToggle = document.getElementById('menuToggle');
        const menuOverlay = document.getElementById('menuOverlay');
        const sidebar = document.getElementById('sidebar');
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleMenu());
        }
        
        if (menuOverlay) {
            menuOverlay.addEventListener('click', () => this.closeMenu());
        }
        
        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openModal(settingsModal));
        }
        
        // Search button
        const searchBtn = document.getElementById('searchBtn');
        const searchModal = document.getElementById('searchModal');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.openModal(searchModal));
        }
        
        // New chat button
        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn && this.chat) {
            newChatBtn.addEventListener('click', () => this.chat.newChat());
        }
        
        // Clear history button
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }
        
        // Export chats button
        const exportChatsBtn = document.getElementById('exportChatsBtn');
        if (exportChatsBtn) {
            exportChatsBtn.addEventListener('click', () => this.exportChats());
        }
        
        // Clear all data button
        const clearAllDataBtn = document.getElementById('clearAllDataBtn');
        if (clearAllDataBtn) {
            clearAllDataBtn.addEventListener('click', () => this.clearAllData());
        }
        
        // Close all modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) this.closeModal(modal);
            });
        });
        
        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
        
        // Theme options
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                this.setTheme(theme);
                this.closeModal(document.getElementById('settingsModal'));
            });
        });
        
        // Font size options
        document.querySelectorAll('.font-size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const size = btn.dataset.size;
                this.setFontSize(size);
            });
        });
        
        // Language change
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                storage.set('language', e.target.value);
                showToast('Language preference saved', 'success');
            });
        }
        
        // Madhhab change
        const madhhabSelect = document.getElementById('madhhabSelect');
        if (madhhabSelect) {
            madhhabSelect.addEventListener('change', (e) => {
                storage.set('madhhab', e.target.value);
                showToast('Madhhab preference saved', 'success');
            });
        }
        
        // Citations toggle
        const citationsToggle = document.getElementById('includeCitations');
        if (citationsToggle) {
            citationsToggle.addEventListener('change', (e) => {
                storage.set('includeCitations', e.target.checked);
            });
        }
        
        // Auto save toggle
        const autoSaveToggle = document.getElementById('autoSaveChats');
        if (autoSaveToggle) {
            autoSaveToggle.addEventListener('change', (e) => {
                storage.set('autoSaveChats', e.target.checked);
            });
        }
        
        // Sound notifications toggle
        const soundToggle = document.getElementById('soundNotifications');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                storage.set('soundNotifications', e.target.checked);
            });
        }
        
        // Load saved preferences
        this.loadPreferences();
        
        // Handle window resize
        window.addEventListener('resize', debounce(() => {
            if (window.innerWidth > 768 && this.isMenuOpen) {
                this.closeMenu();
            }
        }, 250));
    }
    
    loadPreferences() {
        const language = storage.get('language', 'en');
        const madhhab = storage.get('madhhab', 'general');
        const includeCitations = storage.get('includeCitations', true);
        const autoSaveChats = storage.get('autoSaveChats', true);
        const soundNotifications = storage.get('soundNotifications', false);
        
        const languageSelect = document.getElementById('languageSelect');
        const madhhabSelect = document.getElementById('madhhabSelect');
        const citationsToggle = document.getElementById('includeCitations');
        const autoSaveToggle = document.getElementById('autoSaveChats');
        const soundToggle = document.getElementById('soundNotifications');
        
        if (languageSelect) languageSelect.value = language;
        if (madhhabSelect) madhhabSelect.value = madhhab;
        if (citationsToggle) citationsToggle.checked = includeCitations;
        if (autoSaveToggle) autoSaveToggle.checked = autoSaveChats;
        if (soundToggle) soundToggle.checked = soundNotifications;
    }
    
    toggleTheme() {
        const newTheme = document.body.hasAttribute('data-theme') ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            document.body.removeAttribute('data-theme');
        }
        
        storage.set('theme', theme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = theme === 'dark' ? 'fa-sun' : 'fa-moon';
            themeToggle.innerHTML = `<i class="fas ${icon}"></i>`;
        }
        
        showToast(`${theme === 'dark' ? 'Dark' : 'Light'} theme activated`, 'success');
    }
    
    setFontSize(size) {
        this.currentFontSize = size;
        const sizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };
        
        document.documentElement.style.fontSize = sizes[size];
        storage.set('fontSize', size);
        
        // Update active button
        document.querySelectorAll('.font-size-btn').forEach(btn => {
            if (btn.dataset.size === size) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        showToast(`Font size set to ${size}`, 'success');
    }
    
    toggleMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('menuOverlay');
        
        if (this.isMenuOpen) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        } else {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        }
        
        this.isMenuOpen = !this.isMenuOpen;
    }
    
    closeMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('menuOverlay');
        
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        this.isMenuOpen = false;
    }
    
    openModal(modal) {
        if (modal) {
            modal.classList.add('open');
        }
    }
    
    closeModal(modal) {
        if (modal) {
            modal.classList.remove('open');
        }
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
    }
    
    async clearHistory() {
        if (confirm('Are you sure you want to clear all chat history?')) {
            try {
                await api.clearHistory();
                if (this.chat) {
                    await this.chat.loadHistory();
                }
                showToast('Chat history cleared', 'success');
            } catch (error) {
                console.error('Clear history error:', error);
                showToast('Failed to clear history', 'error');
            }
        }
    }
    
    async exportChats() {
        try {
            const history = await api.getChatHistory(1000);
            const data = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                chats: history.data
            };
            
            const jsonStr = JSON.stringify(data, null, 2);
            downloadFile(jsonStr, `suleman-chats-${Date.now()}.json`, 'application/json');
            showToast('Chats exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Failed to export chats', 'error');
        }
    }
    
    async clearAllData() {
        const confirmMsg = 'WARNING: This will delete ALL your data including settings and chat history. This action cannot be undone. Are you sure?';
        
        if (confirm(confirmMsg)) {
            try {
                // Clear all storage
                storage.clear();
                
                // Clear API data
                await api.clearAllUserData();
                
                // Reset preferences
                this.currentTheme = 'light';
                this.currentFontSize = 'medium';
                this.initTheme();
                this.initFontSize();
                
                // Reload page
                window.location.reload();
                
            } catch (error) {
                console.error('Clear data error:', error);
                showToast('Failed to clear data', 'error');
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sulemanApp = new SulemanApp();
});