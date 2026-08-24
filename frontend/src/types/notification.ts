export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  type?: 'ticket' | 'sla' | 'asset' | 'access' | 'offboarding' | 'system' | string;
  reference_id?: number;
  created_at: string;
}

export interface NotificationCount {
  unread_count: number;
  total_count?: number;
}
