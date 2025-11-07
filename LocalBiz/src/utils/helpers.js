/**
 * Development logger utility
 * Only logs in development mode, filters out in production
 */
export const logger = {
  /**
   * Log development messages
   */
  dev: (message, ...args) => {
    if (import.meta.env.DEV) {
      console.log(`[DEV] ${message}`, ...args);
    }
  },

  /**
   * Log warnings (always shown)
   */
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  /**
   * Log errors (always shown) 
   */
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  /**
   * Log info messages in development
   */
  info: (message, ...args) => {
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
};

/**
 * Text capitalization utility
 */
export const capitalizeText = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Debounce utility for performance optimization
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};