import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Enterprise Dashboard';
    if (pathname.startsWith('/tickets/new')) return 'Create New Ticket';
    if (pathname.match(/^\/tickets\/\d+/)) return 'Ticket Details';
    if (pathname.startsWith('/tickets')) return 'Ticket Management';
    if (pathname.startsWith('/assets')) return 'IT Asset Management';
    if (pathname.startsWith('/access-requests')) return 'Access Requests';
    if (pathname.startsWith('/offboarding')) return 'Employee Offboarding';
    if (pathname.startsWith('/knowledge-base')) return 'Knowledge Base';
    if (pathname.startsWith('/reports')) return 'Reports & Service Analytics';
    if (pathname.startsWith('/profile')) return 'User Profile & Settings';
    return 'IT Service Desk';
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-800 dark:text-slate-100 antialiased">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <Sidebar isOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} pageTitle={pageTitle} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
