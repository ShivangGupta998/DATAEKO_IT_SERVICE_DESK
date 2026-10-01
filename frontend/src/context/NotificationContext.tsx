import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types/notification';
import { STORAGE_KEY_TOKEN } from '../api/client';
import { autoRequestNotificationPermission } from '../utils/notifications';
import { NotificationContext } from './notificationContextDef';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { isAuthenticated, token, isLoading } = useAuth();

  const refreshNotifications = useCallback(async () => {
    const activeToken = localStorage.getItem(STORAGE_KEY_TOKEN) || token;

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
  }, [isAuthenticated, isLoading, token]);

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
      // Ignore silently
    }
  }, []);

  useEffect(() => {
    const activeToken = localStorage.getItem(STORAGE_KEY_TOKEN) || token;

    if (isLoading || !isAuthenticated || !activeToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    autoRequestNotificationPermission();
    refreshNotifications();

    const handleImmediateRefresh = () => {
      refreshNotifications();
    };
    window.addEventListener('itsm:refresh-notifications', handleImmediateRefresh);

    const interval = setInterval(() => {
      const liveToken = localStorage.getItem(STORAGE_KEY_TOKEN) || token;
      if (liveToken && isAuthenticated && !isLoading) {
        refreshNotifications();
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('itsm:refresh-notifications', handleImmediateRefresh);
    };
  }, [isAuthenticated, isLoading, token, refreshNotifications]);

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