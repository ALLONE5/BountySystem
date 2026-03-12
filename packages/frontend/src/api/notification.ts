import apiClient from './client';
import type { Notification } from '../types';

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface BroadcastRequest {
  title: string;
  message: string;
  targetType: 'all' | 'users' | 'role' | 'position';
  targetValue?: string | string[]; // userIds array, role string, or position ID
}

/**
 * Get user's notifications
 */
export const getNotifications = async (unreadOnly: boolean = false): Promise<Notification[]> => {
  const response = await apiClient.get<Notification[]>('/notifications', {
    params: { unreadOnly },
  });
  
  // API client interceptor already extracts the data field
  return response.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
  
  // API client interceptor already extracts the data field
  // The response.data should now be { count: number }
  if (typeof response.data?.count !== 'number') {
    throw new Error('Invalid response format from unread count API');
  }
  
  return response.data.count;
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string): Promise<Notification> => {
  const response = await apiClient.patch<Notification>(
    `/notifications/${notificationId}/read`
  );
  return response.data; // API client interceptor already extracts the data field
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  await apiClient.patch('/notifications/read-all');
};

/**
 * Broadcast notification to all users (admin only)
 */
export const broadcastNotification = async (data: BroadcastRequest): Promise<number> => {
  const response = await apiClient.post<{ count: number }>(
    '/notifications/broadcast',
    data
  );
  return response.data.count; // API client interceptor already extracts the data field
};
