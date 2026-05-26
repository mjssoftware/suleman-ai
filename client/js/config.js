const CONFIG = {
    API_BASE_URL: window.location.origin + '/api',
    DEFAULT_USER_ID: null,
    DEFAULT_SESSION_ID: null,
    MAX_MESSAGE_LENGTH: 2000,
    TYPING_DELAY: 500,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    CACHE_TTL: 3600000, // 1 hour
    UI: {
        MESSAGE_FADE_IN_DURATION: 300,
        SCROLL_SMOOTHING: true
    }
};

// Generate or retrieve user ID
function getUserId() {
    let userId = localStorage.getItem('suleman_user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 16);
        localStorage.setItem('suleman_user_id', userId);
    }
    return userId;
}

function getSessionId() {
    let sessionId = sessionStorage.getItem('suleman_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        sessionStorage.setItem('suleman_session_id', sessionId);
    }
    return sessionId;
}

CONFIG.DEFAULT_USER_ID = getUserId();
CONFIG.DEFAULT_SESSION_ID = getSessionId();