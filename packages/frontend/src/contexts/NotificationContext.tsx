import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { notification as antdNotification } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { Notification } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';
import { getUnreadCount } from '../api/notification';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  showNotificationToast: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  // Load initial unread count only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshUnreadCount();
    }
  }, [isAuthenticated]);

  const refreshUnreadCount = useCallback(async () => {
    // Only fetch if authenticated
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
      // Don't throw error, just log it
    }
  }, [isAuthenticated]);

  const showNotificationToast = useCallback((notification: Notification) => {
    // Show a toast notification
    antdNotification.open({
      message: notification.title,
      description: notification.message,
      icon: <BellOutlined style={{ color: '#1890ff' }} />,
      placement: 'topRight',
      duration: 4.5,
      onClick: () => {
        // Navigate to notification page or related task
        if (notification.relatedTaskId) {
          window.location.href = `/tasks/${notification.relatedTaskId}`;
        } else {
          window.location.href = '/notifications';
        }
      },
    });
  }, []);

  // Handle real-time notifications
  const handleNotification = useCallback(
    (notification: Notification) => {
      console.log('New notification received:', notification);
      
      // Increment unread count
      setUnreadCount((prev) => prev + 1);
      
      // Show toast notification
      showNotificationToast(notification);
      
      // Trigger events for specific notification types
      if (notification.type === 'review_required') {
        // New application submitted - notify admins
        window.dispatchEvent(new Event('application-submitted'));
      } else if (notification.type === 'position_approved' || notification.type === 'position_rejected') {
        // Application reviewed - update badge for admins
        window.dispatchEvent(new Event('application-reviewed'));
      }
    },
    [showNotificationToast]
  );

  // Initialize WebSocket connection
  // Don't call refreshUnreadCount on connect to avoid rate limiting issues
  useWebSocket({
    onNotification: handleNotification,
    onConnect: () => {
      console.log('WebSocket connected - notifications enabled');
      // Don't refresh count here - it's already loaded in useEffect
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected - notifications disabled (this is normal in development)');
    },
    onError: (error) => {
      console.log('WebSocket error (this is normal when backend is not running):', error.message);
    },
  });

  const value: NotificationContextType = {
    unreadCount,
    refreshUnreadCount,
    showNotificationToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};
