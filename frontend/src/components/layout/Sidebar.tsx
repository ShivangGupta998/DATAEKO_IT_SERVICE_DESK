import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Laptop,
  KeyRound,
  UserX,
  UserPlus,
  BookOpen,
  BarChart3,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const {
    user,
    roleId,
    roleName,
    isTechnician,
    isEmployee,
    logout,
  } = useAuth();
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

  // Role IDs: 1 = Admin, 2 = Manager, 3 = Technician, 4 = Employee
  const currentRoleId = roleId && [1, 2, 3, 4].includes(roleId) ? roleId : 4;

  // Role-restricted navigation
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: [1, 2, 3, 4],
      end: false,
    },
    {
      to: '/tickets',
      label: isEmployee
        ? 'My Tickets'
        : isTechnician
        ? 'Assigned Tickets'
        : 'Tickets',
      icon: Ticket,
      roles: [1, 2, 3, 4],
      end: true,
    },
    {
      to: '/tickets/new',
      label: 'Create Ticket',
      icon: PlusCircle,
      roles: [1, 2, 4],
      end: false,
    },
    {
      to: '/assets',
      label: 'Assets',
      icon: Laptop,
      roles: [1, 2, 3, 4],
      end: false,
    },
    {
      to: '/access-requests',
      label: 'Access Requests',
      icon: KeyRound,
      roles: [1, 2, 3, 4],
      end: false,
    },
    {
      to: '/admin/onboarding',
      label: 'Employee Onboarding',
      icon: UserPlus,
      roles: [1, 2],
      end: false,
    },
    {
      to: '/offboarding',
      label: 'Offboarding',
      icon: UserX,
      roles: [1, 2],
      end: false,
    },
    {
      to: '/knowledge-base',
      label: 'Knowledge Base',
      icon: BookOpen,
      roles: [1, 2, 3, 4],
      end: false,
    },
    {
      to: '/reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      roles: [1, 2],
      end: false,
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(currentRoleId)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name?: string, username?: string) => {
    const target = name || username || 'USER';
    const parts = target.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return target.slice(0, 2).toUpperCase();
  };

  return (
    <aside
      id="main-sidebar"
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-950/70 dark:backdrop-blur-2xl text-slate-800 dark:text-slate-100 flex flex-col border-r border-slate-200 dark:border-slate-800/80 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),4px_0_24px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="p-5 flex items-center space-x-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/25 dark:shadow-sky-500/30 border border-indigo-400/30 dark:border-sky-400/30 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h1 className="font-black text-xl tracking-tight text-slate-900 dark:text-white">
          IT Service Desk
        </h1>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 border ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/30 dark:shadow-sky-500/25 border-indigo-400/30 dark:border-sky-400/40'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Card & Logout Footer */}
      <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 dark:backdrop-blur-xl">
        <Link
          to="/profile"
          onClick={onCloseMobile}
          className="flex items-center space-x-3 p-2 -m-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 dark:hover:border dark:hover:border-sky-500/20 transition-all group cursor-pointer"
          title="View & Edit Profile Settings"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-indigo-500/40 dark:border-sky-400/60 dark:shadow-[0_0_10px_rgba(56,189,248,0.3)] transition-colors"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-700 dark:bg-slate-800 dark:border-2 dark:border-sky-400/60 dark:shadow-[0_0_10px_rgba(56,189,248,0.3)] flex items-center justify-center text-slate-200 dark:text-sky-200 font-bold text-xs shrink-0 transition-colors">
              {getInitials(user?.full_name, user?.username)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate group-hover:text-indigo-600 dark:group-hover:text-sky-300 transition-colors">
              {user?.full_name || user?.username || 'USER'}
            </p>
            <div className="flex items-center space-x-2">
              <p className="text-[10px] text-indigo-600 dark:text-sky-400 font-semibold truncate uppercase">
                {roleName || 'Employee'}
              </p>
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full block text-center py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-400 dark:hover:border-rose-500/50 border border-slate-300 dark:border-slate-700/60 dark:bg-slate-900/50 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-xl transition-all uppercase tracking-wider active:scale-98"
        >
          LOGOUT
        </button>
      </div>
    </aside>
  );
};