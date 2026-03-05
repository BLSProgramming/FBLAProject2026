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

/**
 * Flexible property getter — resolves camelCase / PascalCase / lowercase 
 * mismatches from API responses.
 * @param {Object} obj   The object to read from
 * @param {...string} names  One or more candidate property names
 * @returns The first non-null/undefined value found, or undefined
 */
export const getProp = (obj, ...names) => {
  for (const n of names) {
    if (!obj) continue;
    const v = obj[n];
    if (v !== undefined && v !== null) return v;
    const lower = obj[n.toLowerCase()];
    if (lower !== undefined && lower !== null) return lower;
    const upper = obj[n.charAt(0).toUpperCase() + n.slice(1)];
    if (upper !== undefined && upper !== null) return upper;
  }
  return undefined;
};

/**
 * Parse ownership tags from either an array or comma-separated string.
 * @param {string|string[]} raw  Tags value from the API
 * @returns {string[]}
 */
export const parseOwnershipTags = (raw) => {
  if (Array.isArray(raw)) return raw.map(t => String(t).trim()).filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) return raw.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

/**
 * Format an ISO date string to MM/DD/YYYY, avoiding timezone shifts
 * by splitting on 'T' first.
 * @param {string} dateString  ISO-format date
 * @returns {string}
 */
export const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-');
  return `${month}/${day}/${year}`;
};

/**
 * Format an ISO date string using Intl, with an optional "extended" style.
 * @param {string} dateString  ISO-format date
 * @param {"standard"|"extended"} format
 * @returns {string}
 */
export const formatDateLocale = (dateString, format = 'standard') => {
  const date = new Date(dateString);
  if (format === 'extended') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

/**
 * Format a raw phone string into (123) 456-7890 display format.
 * Handles 10-digit and 11-digit (leading 1) numbers.
 * @param {string|number} raw  The unformatted phone value
 * @returns {string}
 */
export const formatPhoneDisplay = (raw) => {
  if (!raw && raw !== 0) return '';
  const d = String(raw).replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) {
    return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
};