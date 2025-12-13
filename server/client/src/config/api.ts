// API Configuration
// Centralized configuration for all API endpoints

export const API_CONFIG = {
  // AI Analysis Server (Python Flask)
  AI_SERVER_URL: 'http://localhost:5000',
  
  // Auth Server (Node.js)
  AUTH_SERVER_URL: 'http://localhost:5001',
} as const

// Helper functions
export const getAIServerURL = (endpoint: string = '') => {
  return `${API_CONFIG.AI_SERVER_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}

export const getAuthServerURL = (endpoint: string = '') => {
  return `${API_CONFIG.AUTH_SERVER_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}

