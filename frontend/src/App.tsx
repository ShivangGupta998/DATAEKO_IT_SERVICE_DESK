import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/common/LoadingState';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { TicketListPage } from './pages/tickets/TicketListPage';
import { TicketDetailPage } from './pages/tickets/TicketDetailPage';
import { TicketCreatePage } from './pages/tickets/TicketCreatePage';
import { AssetListPage } from './pages/assets/AssetListPage';
import { AccessRequestListPage } from './pages/accessRequests/AccessRequestListPage';
import { OffboardingListPage } from './pages/offboarding/OffboardingListPage';
import { KnowledgeBasePage } from './pages/knowledgeBase/KnowledgeBasePage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { OnboardingPage } from './pages/admin/OnboardingPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Route Guard
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <LoadingSpinner size="lg" label="Validating credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Role-Based Route Guard
const RoleRoute: React.FC<{ allowedRoles: number[] }> = ({ allowedRoles }) => {
  const { roleId, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <LoadingSpinner size="lg" label="Checking permissions..." />
      </div>
    );
  }

  if (!roleId || !allowedRoles.includes(roleId)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                {/* Public Authentication Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<Navigate to="/login" replace />} />

                {/* Protected Workspace Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    {/* Default root redirects to dashboard */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* Employee Onboarding & User Management (Admin:1, Manager:2) */}
                    <Route element={<RoleRoute allowedRoles={[1, 2]} />}>
                      <Route path="/admin/onboarding" element={<OnboardingPage />} />
                      <Route path="/admin/users" element={<Navigate to="/admin/onboarding" replace />} />
                    </Route>

                    {/* Ticket Management */}
                    <Route path="/tickets" element={<TicketListPage />} />
                    <Route path="/tickets/:id" element={<TicketDetailPage />} />

                    {/* Create Ticket (Admin:1, Manager:2, Technician:3, Employee:4) */}
                    <Route element={<RoleRoute allowedRoles={[1, 2, 3, 4]} />}>
                      <Route path="/tickets/new" element={<TicketCreatePage />} />
                    </Route>

                    {/* Assets (Admin:1, Manager:2, Technician:3, Employee:4) */}
                    <Route element={<RoleRoute allowedRoles={[1, 2, 3, 4]} />}>
                      <Route path="/assets" element={<AssetListPage />} />
                    </Route>

                    {/* Access Requests (Admin:1, Manager:2, Technician:3, Employee:4) */}
                    <Route element={<RoleRoute allowedRoles={[1, 2, 3, 4]} />}>
                      <Route path="/access-requests" element={<AccessRequestListPage />} />
                      <Route path="/access" element={<Navigate to="/access-requests" replace />} />
                    </Route>

                    {/* Offboarding Checklist (Admin:1, Manager:2) */}
                    <Route element={<RoleRoute allowedRoles={[1, 2]} />}>
                      <Route path="/offboarding" element={<OffboardingListPage />} />
                    </Route>

                    {/* Knowledge Base (Admin:1, Manager:2, Technician:3, Employee:4) */}
                    <Route element={<RoleRoute allowedRoles={[1, 2, 3, 4]} />}>
                      <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                      <Route path="/kb" element={<Navigate to="/knowledge-base" replace />} />
                      <Route path="/knowledgebase" element={<Navigate to="/knowledge-base" replace />} />
                    </Route>

                    {/* Reports & Analytics (Admin:1, Manager:2) */}
                    <Route element={<RoleRoute allowedRoles={[1, 2]} />}>
                      <Route path="/reports" element={<ReportsPage />} />
                    </Route>

                    {/* User Profile */}
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                </Route>

                {/* 404 Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}