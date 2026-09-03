import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types/notification';

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number | string) => Promise<void>;
}

// Keep context internal to this module to keep Vite Fast Refresh happy
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { isAuthenticated, isLoading } = useAuth();

  const refreshNotifications = useCallback(async () => {
    // Strictly prevent any fetch if Auth is loading or user is unauthenticated
    if (isLoading || !isAuthenticated) {
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
  }, [isAuthenticated, isLoading]);

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
    // Do not poll or trigger requests if Auth is still initializing or user is not logged in
    if (isLoading || !isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refreshNotifications();

    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, refreshNotifications]);

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

export { NotificationContext };