/* =========================================================
   HELPER UTILITIES
   ========================================================= */

// Format number with commas
export const formatNumber = (num) => {
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

// Format date
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Format time
export const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Days until expiry
export const daysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

// Expiry status text
export const getExpiryStatusText = (days) => {
  if (days === null || days === undefined) return '';
  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days === 0) return 'Expires today';
  if (days <= 30) return `⚠️ ${days} days left`;
  if (days <= 90) return `${days} days left`;
  return `${days} days left`;
};

// Get status color
export const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'IN STOCK':
      return '#10b981';
    case 'LOW STOCK':
      return '#f59e0b';
    case 'OUT OF STOCK':
      return '#ef4444';
    case 'EXPIRED':
      return '#dc2626';
    default:
      return '#6b7280';
  }
};

// Truncate text
export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

// Search filter
export const filterBySearch = (items, query, fields = ['Item', 'Category']) => {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(item =>
    fields.some(field => String(item[field] || '').toLowerCase().includes(q))
  );
};

// Sort items
export const sortItems = (items, sortBy = 'Item', order = 'asc') => {
  const sorted = [...items].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
};

// Debounce
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Currency formatter
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Percentage formatter
export const formatPercent = (value, total) => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};
