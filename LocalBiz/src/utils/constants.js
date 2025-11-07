// API Configuration
export const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:5236';

// API Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/login',
    REGISTER: '/api/UserRegistration/register',
  },
  BUSINESS: {
    CARDS: '/api/ManageBusiness/cards',
    CARD_BY_SLUG: '/api/ManageBusiness/slug',
    IMAGES: '/api/ManageBusiness/images',
    REVIEWS: '/api/Reviews/business',
    REVIEWS_STATS: '/api/Reviews/stats',
    OFFERS: '/api/offers',
  },
  USER: {
    PROFILE: '/api/user-profile',
    BOOKMARKS: '/api/Bookmarks/user',
  }
};

// Response status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Common configurations
export const CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  PAGINATION_LIMIT: 20,
  DEBOUNCE_DELAY: 300, // ms
};

// Common HTTP headers (no auth tokens used in this app)
export const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

// Get user info from localStorage
export const getUserInfo = () => {
  try {
    return {
      userId: localStorage.getItem('userId'),
      userType: localStorage.getItem('userType'),
      token: localStorage.getItem('token'),
    };
  } catch (error) {
    return { userId: null, userType: null, token: null };
  }
};