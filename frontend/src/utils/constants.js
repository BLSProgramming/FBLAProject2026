// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE;

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

// App info
export const SUPPORT_EMAIL = 'support@bizbuzz.com';

// External service credentials (from .env.local)
export const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
export const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
export const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
export const TURNSTILE_SITE_KEY  = import.meta.env.VITE_TURNSTILE_SITE_KEY;

// Ownership tag options used across dashboard & manageBusiness
export const OWNERSHIP_TAGS = [
  'Black-Owned',
  'Asian-Owned',
  'LGBTQ+ Owned',
  'Latin-Owned',
  'Women-Owned',
];

// Business category options
export const BUSINESS_CATEGORIES = [
  'Food & Beverage',
  'Retail',
  'Health & Wellness',
  'Professional Services',
  'Home Services',
  'Entertainment',
  'Education',
  'Technology',
  'Automotive',
  'Beauty & Personal Care',
  'Other',
];

// Common HTTP headers with auth token when available
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
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