/* =========================================================
   ADVANCED NOTIFICATION SERVICE
   ========================================================= */

export const notificationService = {
  notifications: [],
  listeners: [],

  // Create Toast Notification
  showToast(message, type = 'info', duration = 3000) {
    const id = Date.now();
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
      timestamp: new Date()
    };

    this.notifications.push(notification);
    this.notifyListeners();

    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, duration);
    }

    return id;
  },

  // Show Success
  showSuccess(message, duration = 3000) {
    return this.showToast(message, 'success', duration);
  },

  // Show Error
  showError(message, duration = 4000) {
    return this.showToast(message, 'error', duration);
  },

  // Show Warning
  showWarning(message, duration = 3500) {
    return this.showToast(message, 'warning', duration);
  },

  // Show Info
  showInfo(message, duration = 3000) {
    return this.showToast(message, 'info', duration);
  },

  // Remove Notification
  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  },

  // Subscribe to notifications
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  },

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.notifications));
  },

  // Get all active notifications
  getNotifications() {
    return [...this.notifications];
  },

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  },

  // Browser Notification
  async sendBrowserNotification(title, options = {}) {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, options);
      }
    }
  }
};

// Toast Container Component for React
export const ToastContainer = ({ notifications, onRemove }) => {
  return (
    <div className="toast-container">
      {notifications.map(notification => (
        <div key={notification.id} className={`toast toast-${notification.type}`}>
          <div className="toast-content">{notification.message}</div>
          <button
            className="toast-close"
            onClick={() => onRemove(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
