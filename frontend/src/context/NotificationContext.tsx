import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types/notification';
import { STORAGE_KEY_TOKEN } from '../api/client';

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number | string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { isAuthenticated, token, isLoading } = useAuth();

  const getValidToken = useCallback(() => {
    const active = localStorage.getItem(STORAGE_KEY_TOKEN) || token;
    return active && active.trim() !== '' ? active : null;
  }, [token]);

  const refreshNotifications = useCallback(async () => {
    const activeToken = getValidToken();

    if (isLoading || !isAuthenticated || !activeToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const [listRes, countRes] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);

      setNotifications(listRes || []);
      const count = (countRes as any)?.unread_count ?? (countRes as any)?.count ?? 0;
      setUnreadCount(count);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
      }
    }
  }, [isAuthenticated, isLoading, getValidToken]);

  const markAsRead = useCallback(async (id: number | string) => {
    try {
      await notificationService.markAsRead(id);
      
      setNotifications((prev) => {
        let wasUnread = false;
        const updated = prev.map((n) => {
          if (n.id === id) {
            if (!n.is_read) wasUnread = true;
            return { ...n, is_read: true };
          }
          return n;
        });

        if (wasUnread) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }

        return updated;
      });
    } catch {
      // Quiet fail
    }
  }, []);

  useEffect(() => {
    const activeToken = getValidToken();

    if (isLoading || !isAuthenticated || !activeToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refreshNotifications();

    const interval = setInterval(() => {
      const liveToken = getValidToken();
      if (liveToken && isAuthenticated) {
        refreshNotifications();
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, refreshNotifications, getValidToken]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};