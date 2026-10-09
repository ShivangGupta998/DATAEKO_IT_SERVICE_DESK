import React, { useState, useEffect } from 'react';
import { Menu, Plus, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationBell } from '../notifications/NotificationBell';
import { ThemeToggle } from '../common/ThemeToggle';
import { useNavigate, Link } from 'react-router-dom';
import { autoRequestNotificationPermission } from '../../utils/notifications';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar, pageTitle }) => {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [globalSearch, setGlobalSearch] = useState('');
  const navigate = useNavigate();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (user?.avatar_url) return user.avatar_url;
    if (user?.id) return localStorage.getItem(`itsm_avatar_${user.id}`);
    return null;
  });

  useEffect(() => {
    if (user) {
      setAvatarUrl(user.avatar_url || localStorage.getItem(`itsm_avatar_${user.id}`));
    }
    const handleAvatarUpdate = (e: any) => {
      setAvatarUrl(e.detail?.avatarUrl || null);
    };
    window.addEventListener('itsm:avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('itsm:avatar-updated', handleAvatarUpdate);
  }, [user]);

  const getInitials = (name?: string, username?: string) => {
    const target = name?.trim() || username?.trim() || 'USER';
    const parts = target.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.slice(0, 2).toUpperCase();
  };

  // Automatically request browser notification permission
  useEffect(() => {
    autoRequestNotificationPermission();
  }, []);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    navigate(`/tickets?q=${encodeURIComponent(globalSearch.trim())}`);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 transition-colors duration-300">
      {/* Mobile Toggle, Page Title & Search Bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {pageTitle && (
          <h1 className="text-base font-bold text-slate-900 dark:text-white sm:hidden tracking-tight">
            {pageTitle}
          </h1>
        )}

        <form onSubmit={handleGlobalSearch} className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-950 rounded-full px-4 py-1.5 w-64 md:w-96 border border-transparent focus-within:border-indigo-600 transition-colors">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search tickets, assets or articles..."
            className="bg-transparent border-none text-xs w-full focus:outline-none text-slate-800 dark:text-slate-100 font-medium placeholder-slate-400"
          />
        </form>
      </div>

      {/* Right Action Bar: Notifications, Theme Toggle & Create Ticket Button */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Notifications */}
        <NotificationBell />

        {/* Dark / Light Mode Toggle */}
        <ThemeToggle />

        {/* User Profile Avatar Link */}
        <Link
          to="/profile"
          className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-500 transition-all shrink-0"
          title={`Profile (${user?.full_name || user?.username || 'User'})`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-600 to-sky-500 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
              {getInitials(user?.full_name, user?.username)}
            </div>
          )}
        </Link>

        <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />

        {/* Create Ticket Button */}
        {(isAdmin || isManager || isEmployee) && (
          <Link
            to="/tickets/new"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl transition-all shadow-xs uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>CREATE TICKET</span>
          </Link>
        )}
      </div>
    </header>
  );
};