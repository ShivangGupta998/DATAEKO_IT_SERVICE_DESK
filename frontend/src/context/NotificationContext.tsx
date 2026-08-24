import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types/notification';
import { STORAGE_KEY_TOKEN } from '../api/client';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number | string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { isAuthenticated, token } = useAuth();

  const refreshNotifications = useCallback(async () => {
    // Check both local storage keys to ensure token presence
    const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem('access_token');
    
    // HARD GUARD: Abort immediately if not authenticated or token missing
    if (!isAuthenticated || !token || !storedToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const [listRes, countRes] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount()
      ]);

      setNotifications(listRes || []);
      
      const count = (countRes as any)?.unread_count ?? (countRes as any)?.count ?? 0;
      setUnreadCount(count);
    } catch (err: any) {
      // If 401 Unauthorized returns, clear notification state
      if (err?.response?.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
      }
    }
  }, [isAuthenticated, token]);

  const markAsRead = async (id: number | string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently capture errors
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem('access_token');

    if (!isAuthenticated || !token || !storedToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000); // 30s polling

    return () => clearInterval(interval);
  }, [isAuthenticated, token, refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        markAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};