import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Plus, Server, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';
import { RoleBadge } from '../common/Badge';
import { useNavigate, Link } from 'react-router-dom';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const { user, roleId, isAdmin, isManager, isEmployee, logout, backendUrl, setBackendUrl } = useAuth();
  const [showServerModal, setShowServerModal] = useState(false);
  const [tempUrl, setTempUrl] = useState(backendUrl);
  const [globalSearch, setGlobalSearch] = useState('');
  const navigate = useNavigate();

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    navigate(`/tickets?q=${encodeURIComponent(globalSearch.trim())}`);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
      {/* Mobile Toggle & Search bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleGlobalSearch} className="hidden sm:flex items-center bg-slate-100 rounded-full px-4 py-1.5 w-64 md:w-96">
          <span className="text-slate-400 mr-2 text-sm">🔍</span>
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search tickets, assets or articles..."
            className="bg-transparent border-none text-xs w-full focus:outline-hidden text-slate-700 font-medium placeholder-slate-400"
          />
        </form>
      </div>

      {/* Right Action Icons & Create Ticket Button */}
      <div className="flex items-center space-x-3 sm:space-x-6">
        {/* Backend server indicator */}
        <button
          type="button"
          onClick={() => setShowServerModal(true)}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200 transition-colors uppercase tracking-wider"
          title="Configure API Endpoint"
        >
          <Server className="w-3.5 h-3.5 text-indigo-600" />
          <span>API</span>
        </button>

        {/* Notifications */}
        <NotificationBell />

        <div className="hidden sm:block h-6 w-[1px] bg-slate-200" />

        {/* Create Ticket Button */}
        {(isAdmin || isManager || isEmployee) && (
          <Link
            to="/tickets/new"
            className="bg-indigo-600 text-white text-xs font-bold px-3.5 sm:px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all shadow-xs uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ CREATE TICKET</span>
          </Link>
        )}
      </div>

      {/* Backend URL Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              <span>FastAPI Backend Server</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure the target FastAPI backend server URL. Default is{' '}
              <code className="font-mono font-bold text-indigo-600">http://127.0.0.1:8000</code>.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                API Base URL
              </label>
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowServerModal(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setBackendUrl(tempUrl);
                  setShowServerModal(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs uppercase tracking-wider"
              >
                Save Endpoint
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
