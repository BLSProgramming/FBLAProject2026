import { API_BASE_URL, ENDPOINTS, HTTP_STATUS, getAuthHeaders, getUserInfo } from './constants.js';
import { logger } from './helpers.js';

/**
 * Generic API request handler with comprehensive error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    logger.info(`Making API request to: ${url}`);
    const response = await fetch(url, config);
    
    // Handle authentication errors
    if (response.status === HTTP_STATUS.UNAUTHORIZED) {
      logger.error('Unauthorized access - clearing session');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userType');
      throw new Error('Session expired. Please login again.');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    logger.error(`API Request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Authenticated API request wrapper
 */
function authenticatedRequest(endpoint, options = {}) {
  const { userId, userType } = getUserInfo();
  if (!userId) {
    throw new Error('User not authenticated - please log in');
  }
  
  return apiRequest(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Auth API endpoints
 */
export const authAPI = {
  login: (credentials) => 
    apiRequest(ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData) =>
    apiRequest(ENDPOINTS.AUTH.REGISTER, {
      method: 'POST', 
      body: JSON.stringify(userData),
    }),
};

/**
 * Business API endpoints
 */
export const businessAPI = {
  getCards: () =>
    apiRequest(ENDPOINTS.BUSINESS.CARDS),

  getCard: (slug) =>
    apiRequest(`${ENDPOINTS.BUSINESS.CARD_BY_SLUG}/${slug}`),

  createCard: (cardData) =>
    authenticatedRequest(ENDPOINTS.BUSINESS.CARDS, {
      method: 'POST',
      body: JSON.stringify(cardData),
    }),

  updateCard: (slug, cardData) =>
    authenticatedRequest(`${ENDPOINTS.BUSINESS.CARDS}/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(cardData),
    }),

  deleteCard: (slug) =>
    authenticatedRequest(`${ENDPOINTS.BUSINESS.CARDS}/${slug}`, {
      method: 'DELETE',
    }),

  // Offers
  getOffers: (businessId) =>
    apiRequest(`${ENDPOINTS.BUSINESS.OFFERS}/business/${businessId}`),

  createOffer: (offerData) =>
    authenticatedRequest(ENDPOINTS.BUSINESS.OFFERS, {
      method: 'POST',
      body: JSON.stringify(offerData),
    }),

  // Images
  getImages: (businessId) =>
    apiRequest(`${ENDPOINTS.BUSINESS.IMAGES}/${businessId}`),

  uploadImage: (businessId, formData) =>
    authenticatedRequest(`${ENDPOINTS.BUSINESS.IMAGES}/${businessId}`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        'Authorization': getAuthHeaders().Authorization,
      },
      body: formData,
    }),

  // Reviews
  getReviews: (businessId) =>
    apiRequest(`${ENDPOINTS.BUSINESS.REVIEWS}/${businessId}`),

  getReviewStats: (businessId) =>
    apiRequest(`${ENDPOINTS.BUSINESS.REVIEWS_STATS}/${businessId}`),

  createReview: (reviewData) =>
    authenticatedRequest(ENDPOINTS.BUSINESS.REVIEWS, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),
};

/**
 * User API endpoints
 */
export const userAPI = {
  getProfile: () =>
    authenticatedRequest(ENDPOINTS.USER.PROFILE),

  updateProfile: (profileData) =>
    authenticatedRequest(ENDPOINTS.USER.PROFILE, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  getBookmarks: () => {
    const { userId } = getUserInfo();
    return authenticatedRequest(`${ENDPOINTS.USER.BOOKMARKS}/${userId}`);
  },

  toggleBookmark: (businessUserId) => {
    const { userId } = getUserInfo();
    logger.info('Toggling bookmark for user:', userId, 'business:', businessUserId);
    
    if (!userId) {
      throw new Error('User ID not found in local storage');
    }
    
    const payload = { UserId: Number(userId), BusinessUserId: Number(businessUserId) };
    logger.info('Sending bookmark toggle payload:', payload);
    
    return authenticatedRequest('/api/Bookmarks/toggle', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};