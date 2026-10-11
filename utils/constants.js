/* =========================================================
   CONSTANTS & CONFIGURATION
   ========================================================= */

// Status constants
export const INVENTORY_STATUS = {
  IN_STOCK: 'IN STOCK',
  LOW_STOCK: 'LOW STOCK',
  OUT_OF_STOCK: 'OUT OF STOCK',
  EXPIRED: 'EXPIRED'
};

// Action types
export const ACTIONS = {
  STOCK_IN: 'STOCK IN',
  STOCK_OUT: 'STOCK OUT',
  RECEIVE: 'RECEIVE',
  CONSUME: 'CONSUME',
  TRANSFER: 'TRANSFER',
  ADJUST: 'ADJUST'
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Permissions
export const PERMISSIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  FULL_ACCESS: 'full_access'
};

// Default pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  DEFAULT_PAGE: 1,
  MAX_PAGE_SIZE: 100
};

// Expiry thresholds (in days)
export const EXPIRY_THRESHOLDS = {
  EXPIRED: 0,
  CRITICAL: 30,
  WARNING: 90,
  SAFE: 365
};

// Colors for status
export const STATUS_COLORS = {
  'IN STOCK': '#10b981',
  'LOW STOCK': '#f59e0b',
  'OUT OF STOCK': '#ef4444',
  'EXPIRED': '#dc2626',
  'ACTIVE': '#10b981',
  'INACTIVE': '#6b7280'
};

// API endpoints
export const API_ENDPOINTS = {
  INVENTORY: '/api/inventory',
  SUPPLIERS: '/api/suppliers',
  REPORTS: '/api/reports',
  AUDIT: '/api/audit',
  USERS: '/api/users'
};

// Request timeout (milliseconds)
export const REQUEST_TIMEOUT = 30000;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};
