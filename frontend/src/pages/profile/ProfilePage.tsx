import React, { useState } from 'react';
import {
  User as UserIcon,
  Shield,
  Server,
  Mail,
  Building,
  CheckCircle2,
  Bell,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { RoleBadge } from '../../components/common/Badge';
import { slackService } from '../../services/slackService';
import { parseApiError } from '../../api/client';

export const ProfilePage: React.FC = () => {
  const {
    user,
    roleId,
    roleName,
    isAdmin,
    isManager,
    isTechnician,
    backendUrl,
    setBackendUrl,
  } = useAuth();
  const { success, error: toastError } = useToast();

  const [customUrl, setCustomUrl] = useState(backendUrl);
  const [testingSlack, setTestingSlack] = useState(false);
  const [, setSlackHealth] = useState<string | null>(null);

  const handleUpdateBackendUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setBackendUrl(customUrl.trim());
    success('Backend API Endpoint Updated', customUrl.trim());
  };

  const handleTestSlack = async () => {
    setTestingSlack(true);
    try {
      const res = await slackService.sendTestNotification();
      success('Slack Notification Sent', res.message || 'Notification queued successfully.');
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Slack Test Failed', parsed.message);
    } finally {
      setTestingSlack(false);
    }
  };

  const handleCheckSlackHealth = async () => {
    try {
      const health = await slackService.getHealth();
      setSlackHealth(health.status || 'OK');
      success('Slack Health Checked', `Status: ${health.status || 'Configured'}`);
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Slack Health Check Failed', parsed.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/20">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.full_name || user?.username}
              </h2>
              <RoleBadge roleId={roleId || 4} />
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>@{user?.username}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email || 'No email specified'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.department || 'General IT'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Privileges Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 sm:p-8 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>Role Permissions & Access Matrix</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your account is currently assigned to <strong>{roleName} (Role ID {roleId})</strong> with the following capabilities:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">Ticket Queue Access</span>
              <p className="text-slate-500 mt-0.5">
                {isAdmin || isManager
                  ? 'Full view of all enterprise support tickets across all departments.'
                  : isTechnician
                  ? 'Access to all tickets assigned to your technician ID.'
                  : 'Access to self-service tickets requested by your user account.'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
            <CheckCircle2
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                isAdmin || isManager ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'
              }`}
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">Ticket Assignment & Routing</span>
              <p className="text-slate-500 mt-0.5">
                {isAdmin || isManager
                  ? 'Authorized to assign, reassign, or unassign tickets to technicians via PATCH.'
                  : 'Restricted. Technicians and Employees cannot reassign tickets.'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
            <CheckCircle2
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                isAdmin || isManager ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'
              }`}
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">IT Asset Management & Offboarding</span>
              <p className="text-slate-500 mt-0.5">
                {isAdmin || isManager
                  ? 'Register hardware, assign devices, and track employee departure deprovisioning.'
                  : 'View-only access to devices personally assigned to you.'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
            <CheckCircle2
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                isAdmin || isManager ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'
              }`}
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">Executive Reports & Analytics</span>
              <p className="text-slate-500 mt-0.5">
                {isAdmin || isManager
                  ? 'Real-time SLA compliance, ticket status breakdown, and workload reports.'
                  : 'Restricted to IT management.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backend & Slack Integrations Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend API Configuration */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>FastAPI Server Endpoint</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Current backend target address for all API operations.
          </p>

          <form onSubmit={handleUpdateBackendUrl} className="space-y-3">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="http://127.0.0.1:8000"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <button
              type="submit"
              className="w-full py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-colors"
            >
              Update Target URL
            </button>
          </form>
        </div>

        {/* Slack Integration Diagnostics */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <span>Slack Channel Webhook Test</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify automated Slack notification webhooks configured on your FastAPI backend.
          </p>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleTestSlack}
              disabled={testingSlack}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingSlack ? 'Sending Test...' : 'Send Test Slack Ping'}</span>
            </button>

            <button
              type="button"
              onClick={handleCheckSlackHealth}
              className="w-full py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Check Slack Endpoint Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};