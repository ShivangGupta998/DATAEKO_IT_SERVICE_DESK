import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/common/LoadingState';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
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
import { NotFoundPage } from './pages/NotFoundPage';

// Route Guards
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
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Workspace Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    {/* Default root redirects to dashboard */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* Ticket Management */}
                    <Route path="/tickets" element={<TicketListPage />} />
                    <Route path="/tickets/:id" element={<TicketDetailPage />} />

                    {/* Create Ticket (Admin:1, Manager:2, Employee:4) */}
                    <Route element={<RoleRoute allowedRoles={[1, 2, 4]} />}>
                      <Route path="/tickets/new" element={<TicketCreatePage />} />
                    </Route>

                    {/* Assets (Admin:1, Manager:2, Employee:4) */}
                    <Route element={<RoleRoute allowedRoles={[1, 2, 4]} />}>
                      <Route path="/assets" element={<AssetListPage />} />
                    </Route>

                    {/* Access Requests (Admin:1, Manager:2, Employee:4) */}
                    <Route element={<RoleRoute allowedRoles={[1, 2, 4]} />}>
                      <Route path="/access-requests" element={<AccessRequestListPage />} />
                    </Route>

                    {/* Offboarding (Admin:1, Manager:2, Employee:4) */}
                    <Route element={<RoleRoute allowedRoles={[1, 2, 4]} />}>
                      <Route path="/offboarding" element={<OffboardingListPage />} />
                    </Route>

                    {/* Knowledge Base (Admin:1, Manager:2, Technician:3, Employee:4) */}
                    <Route element={<RoleRoute allowedRoles={[1, 2, 3, 4]} />}>
                      <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
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