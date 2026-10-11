/* =========================================================
   TOAST NOTIFICATION COMPONENT
   ========================================================= */

import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService.js';

export const ToastNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  return (
    <div className="toast-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`toast toast-${notification.type}`}
          style={{
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div className="toast-icon">
            {notification.type === 'success' && '✓'}
            {notification.type === 'error' && '✕'}
            {notification.type === 'warning' && '⚠'}
            {notification.type === 'info' && 'ℹ'}
          </div>
          <div className="toast-content">{notification.message}</div>
          <button
            className="toast-close"
            onClick={() => notificationService.removeNotification(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

// CSS Styles
const toastStyles = `
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
  background: #ffffff;
  border-left: 4px solid #6b7280;
}

.toast-success {
  background: #ecfdf5;
  border-left-color: #10b981;
  color: #065f46;
}

.toast-error {
  background: #fef2f2;
  border-left-color: #ef4444;
  color: #7f1d1d;
}

.toast-warning {
  background: #fffbeb;
  border-left-color: #f59e0b;
  color: #78350f;
}

.toast-info {
  background: #eff6ff;
  border-left-color: #3b82f6;
  color: #1e3a8a;
}

.toast-icon {
  font-weight: bold;
  font-size: 18px;
  min-width: 24px;
}

.toast-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.7;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  opacity: 1;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .toast-container {
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .toast {
    padding: 12px 14px;
  }
}
`;

export default ToastNotification;
