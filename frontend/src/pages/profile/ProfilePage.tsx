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
  Activity,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
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

  const getDepartmentName = () => {
    if (!user?.department) return 'General IT';
    if (typeof user.department === 'object') return user.department.name || 'General IT';
    return user.department;
  };

  return (
    <div className="space-y-8 transition-colors duration-300 antialiased selection:bg-indigo-500 selection:text-white pb-10">
      {/* Top Header Profile Card */}
      <div className="bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-800/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Glowing Avatar */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-sky-400 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-20 h-20 rounded-2xl bg-slate-950 border border-indigo-500/30 text-white flex items-center justify-center font-black text-3xl shadow-2xl">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Authenticated Account Profile
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                {user?.full_name || user?.username}
              </h2>
              <RoleBadge roleId={roleId || 4} />
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/40 border border-slate-800/60">
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-200">@{user?.username}</span>
              </span>
              <span className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/40 border border-slate-800/60">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-200">{user?.email || 'No email specified'}</span>
              </span>
              <span className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/40 border border-slate-800/60">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-200">{getDepartmentName()}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Privileges Matrix */}
      <div className="bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/50 p-6 sm:p-8 space-y-5">
        <div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">
            PRIVILEGE MATRIX
          </span>
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>Role Permissions & Access Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Your account is assigned to <strong className="text-indigo-300 font-bold">{roleName} (Role ID {roleId})</strong> with the following capabilities:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Ticket Queue Access */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 group">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-white tracking-wide block mb-1">
                  Ticket Queue Access
                </span>
                <p className="text-slate-400 leading-relaxed font-medium">
                  {isAdmin || isManager
                    ? 'Full view of all enterprise support tickets across all departments.'
                    : isTechnician
                    ? 'Access to all tickets assigned to your technician ID.'
                    : 'Access to self-service tickets requested by your user account.'}
                </p>
              </div>
            </div>
          </div>

          {/* Ticket Assignment & Routing */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 group">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl border shrink-0 ${
                  isAdmin || isManager
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800/40 border-slate-800 text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-white tracking-wide block mb-1">
                  Ticket Assignment & Routing
                </span>
                <p className="text-slate-400 leading-relaxed font-medium">
                  {isAdmin || isManager
                    ? 'Authorized to assign, reassign, or unassign tickets to technicians via PATCH.'
                    : 'Restricted. Technicians and Employees cannot reassign tickets.'}
                </p>
              </div>
            </div>
          </div>

          {/* IT Asset Management & Offboarding */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 group">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl border shrink-0 ${
                  isAdmin || isManager
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800/40 border-slate-800 text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-white tracking-wide block mb-1">
                  IT Asset Management & Offboarding
                </span>
                <p className="text-slate-400 leading-relaxed font-medium">
                  {isAdmin || isManager
                    ? 'Register hardware, assign devices, and track employee departure deprovisioning.'
                    : 'View-only access to devices personally assigned to you.'}
                </p>
              </div>
            </div>
          </div>

          {/* Executive Reports & Analytics */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 group">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl border shrink-0 ${
                  isAdmin || isManager
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800/40 border-slate-800 text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-white tracking-wide block mb-1">
                  Executive Reports & Analytics
                </span>
                <p className="text-slate-400 leading-relaxed font-medium">
                  {isAdmin || isManager
                    ? 'Real-time SLA compliance, ticket status breakdown, and workload reports.'
                    : 'Restricted to IT management.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backend & Integration Configuration Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Backend API Configuration */}
        <div className="bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/50 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
              SYSTEM ENDPOINT
            </span>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>FastAPI Server Endpoint</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Current backend target address for all API operations.
            </p>
          </div>

          <form onSubmit={handleUpdateBackendUrl} className="space-y-3 pt-2">
            <div className="relative">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="w-full px-4 py-2.5 text-xs bg-slate-950/80 border border-slate-800 text-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono transition-all outline-none"
              />
              <Cpu className="w-4 h-4 text-slate-600 absolute right-3 top-3 pointer-events-none" />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Update Target URL
            </button>
          </form>
        </div>

        {/* Slack Integration Diagnostics */}
        <div className="bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/50 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
              INTEGRATION DIAGNOSTICS
            </span>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span>Slack Webhook Diagnostics</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Verify automated Slack notification webhooks configured on your FastAPI backend.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleTestSlack}
              disabled={testingSlack}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              <span>{testingSlack ? 'Sending Test...' : 'Send Test Slack Ping'}</span>
            </button>

            <button
              type="button"
              onClick={handleCheckSlackHealth}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Check Slack Endpoint Status</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};