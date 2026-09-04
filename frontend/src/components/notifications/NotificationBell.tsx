import React, { useState, useEffect, useRef } from 'react';
import { Bell, Info, ShieldAlert, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItem } from '../../types/notification';

export const NotificationBell: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Do not render if Auth is loading or user is not authenticated
  if (isLoading || !isAuthenticated) return null;

  // Handle clicking a notification item: mark read & navigate
  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      try {
        await markAsRead(item.id);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    setIsOpen(false);

    const notificationType = (item.type || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const refId = item.reference_id || item.message.match(/#(\d+)/)?.[1];

    if (
      notificationType === 'ticket' ||
      notificationType === 'sla' ||
      title.includes('ticket') ||
      title.includes('sla')
    ) {
      if (refId) {
        navigate(`/tickets/${refId}`);
      } else {
        navigate('/tickets');
      }
    } else if (notificationType === 'offboarding' || title.includes('offboarding')) {
      navigate('/offboarding');
    } else if (notificationType === 'access' || title.includes('access')) {
      navigate('/access-requests');
    } else if (notificationType === 'asset' || title.includes('asset')) {
      navigate('/assets');
    }
  };

  // Render contextual icon based on notification type
  const renderNotificationIcon = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'sla' || t.includes('breach') || t.includes('urgent')) {
      return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
    }
    if (t === 'ticket') {
      return <Ticket className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />;
    }
    return <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus:outline-none"
        aria-label="Toggle Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No notifications right now.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                    item.is_read
                      ? 'bg-slate-900/40 text-slate-400 hover:bg-slate-800/30'
                      : 'bg-slate-800/50 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {renderNotificationIcon(item.type)}
                  <div className="flex-1 text-xs leading-snug min-w-0">
                    {item.title && (
                      <p className="font-bold text-white text-[11px] truncate mb-0.5">
                        {item.title}
                      </p>
                    )}
                    <p className="font-medium line-clamp-2">{item.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Just now'}
                    </span>
                  </div>
                  {!item.is_read && (
                    <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};