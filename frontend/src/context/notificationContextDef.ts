import { createContext } from 'react';
import { NotificationItem } from '../types/notification';

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number | string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
