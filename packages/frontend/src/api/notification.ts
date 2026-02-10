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
  const response = await apiClient.get<NotificationResponse>('/notifications', {
    params: { unreadOnly },
  });
  return response.data.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
  return response.data.data.count;
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string): Promise<Notification> => {
  const response = await apiClient.patch<{ success: boolean; data: Notification }>(
    `/notifications/${notificationId}/read`
  );
  return response.data.data;
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
  const response = await apiClient.post<{ success: boolean; data: { count: number } }>(
    '/notifications/broadcast',
    data
  );
  return response.data.data.count;
};
