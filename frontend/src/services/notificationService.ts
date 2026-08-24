import { apiClient, STORAGE_KEY_TOKEN } from '../api/client';
import { NotificationItem, NotificationCount } from '../types/notification';

export const notificationService = {
  async getNotifications(params?: { limit?: number; offset?: number }): Promise<NotificationItem[]> {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!token) return [];

    try {
      const response = await apiClient.get<NotificationItem[]>('/notifications/', { params });
      return response.data;
    } catch (error) {
      return [];
    }
  },

  async getUnreadCount(): Promise<NotificationCount> {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    
    // Return zero immediately if user isn't logged in
    if (!token) {
      return { unread_count: 0 } as NotificationCount;
    }

    try {
      const response = await apiClient.get<NotificationCount>('/notifications/count');
      return response.data;
    } catch (error) {
      return { unread_count: 0 } as NotificationCount;
    }
  },

  async markAsRead(notificationId: number | string): Promise<NotificationItem> {
    const response = await apiClient.patch<NotificationItem>(`/notifications/${notificationId}/read`);
    return response.data;
  },
};