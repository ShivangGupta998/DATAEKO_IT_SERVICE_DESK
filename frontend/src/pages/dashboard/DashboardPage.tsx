import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ticket as TicketIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  PlusCircle,
  Laptop,
  KeyRound,
  BookOpen,
  ArrowUpRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../services/ticketService';
import { Ticket } from '../../types/ticket';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { parseApiError } from '../../api/client';

export const DashboardPage: React.FC = () => {
  const { user, isAdmin, isManager, isTechnician, isEmployee, roleName } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: Ticket[] = [];
      if (isAdmin || isManager) {
        data = await ticketService.getAllTickets();
      } else if (isTechnician) {
        data = await ticketService.getAssignedTickets();
      } else {
        data = await ticketService.getMyTickets();
      }
      setTickets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isAdmin, isManager, isTechnician, isEmployee]);

  // Derived Statistics from real tickets data
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => {
      const s = (t.status || '').toLowerCase();
      return s === 'open' || s === 'new' || s === 'pending';
    }).length;
    const inProgress = tickets.filter((t) => (t.status || '').toLowerCase() === 'in progress').length;
    const resolved = tickets.filter((t) => ['resolved', 'closed'].includes((t.status || '').toLowerCase())).length;

    const critical = tickets.filter(
      (t) => (t.priority || '').toLowerCase() === 'critical' && !['resolved', 'closed'].includes((t.status || '').toLowerCase())
    ).length;

    const slaBreached = tickets.filter((t) => {
      const isClosed = ['resolved', 'closed'].includes((t.status || '').toLowerCase());
      if (isClosed) return false;
      const rem = t.sla?.remaining_minutes ?? t.remaining_minutes;
      const status = (t.sla?.status || t.sla_status || '').toLowerCase();
      return (rem !== undefined && rem <= 0) || status.includes('breach') || t.sla?.is_breached;
    }).length;

    const slaAtRisk = tickets.filter((t) => {
      const isClosed = ['resolved', 'closed'].includes((t.status || '').toLowerCase());
      if (isClosed) return false;
      const rem = t.sla?.remaining_minutes ?? t.remaining_minutes;
      const status = (t.sla?.status || t.sla_status || '').toLowerCase();
      return !status.includes('breach') && ((rem !== undefined && rem > 0 && rem < 60) || status.includes('risk'));
    }).length;

    return { total, open, inProgress, resolved, critical, slaBreached, slaAtRisk };
  }, [tickets]);

  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [tickets]);

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
            {roleName} Workspace • Enterprise Insights
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isEmployee ? 'My Helpdesk Hub' : isTechnician ? 'Technician Queue' : 'System Overview'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {isEmployee && (
            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors uppercase tracking-wider shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Ticket</span>
            </Link>
          )}
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors uppercase tracking-wider shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchDashboardData} />}

      {/* 4 Dynamic Metric Cards */}
      {isLoading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
              {isEmployee ? 'Active Requests' : 'Active Tickets'}
            </p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.open + stats.inProgress}</h3>
            <div className="mt-2 flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <span>↑ Active in queue ({stats.total} total)</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-tight">
              {isEmployee ? 'In Progress' : 'SLA At Risk'}
            </p>
            <h3 className="text-3xl font-black text-amber-500 mt-1">
              {isEmployee ? stats.inProgress : stats.slaAtRisk}
            </h3>
            <div className="mt-2 flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>{isEmployee ? 'Being worked on' : 'Response time < 1hr'}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight">
              {isEmployee ? 'Needs Attention' : 'SLA Breached'}
            </p>
            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-500 mt-1">
              {isEmployee ? stats.critical : stats.slaBreached.toString().padStart(2, '0')}
            </h3>
            <div className="mt-2 flex items-center text-rose-600 dark:text-rose-400 text-xs font-bold">
              <span>{isEmployee ? 'High/Critical priority' : 'Immediate action required'}</span>
            </div>
          </div>

          <div className="bg-indigo-50/50 dark:bg-slate-900 p-5 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-xs transition-colors">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
              {isEmployee ? 'Resolved Requests' : 'Resolved Total'}
            </p>
            <h3 className="text-3xl font-black text-indigo-700 dark:text-indigo-400 mt-1">{stats.resolved}</h3>
            <div className="mt-2 flex items-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              <span>Completed tickets</span>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Role-Specific Ticket Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {isEmployee ? 'My Active Requests' : isTechnician ? 'My Assigned Queue' : 'Recent Escalations'}
            </h4>
            <Link
              to="/tickets"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wider inline-flex items-center gap-1"
            >
              <span>View All Tickets</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
              No tickets recorded in system.
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Ticket ID</th>
                    <th className="px-6 py-3">{isEmployee ? 'Subject' : 'Requester'}</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {recentTickets.map((t) => {
                    const remMin = t.sla?.remaining_minutes ?? t.remaining_minutes;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/tickets/${t.id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          INC-{t.id}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                          {isEmployee
                            ? t.title || 'Support Request'
                            : t.requester?.full_name || t.requester?.username || t.requester_name || 'User'}
                        </td>
                        <td className="px-6 py-4">
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {remMin !== undefined ? (
                            remMin <= 0 ? (
                              <span className="text-rose-600 dark:text-rose-400 font-black">-{Math.abs(remMin)}m</span>
                            ) : (
                              <span className="text-slate-600 dark:text-slate-400 font-bold">{remMin}m</span>
                            )
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 font-medium">On Track</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Quick Portal / Capacity Card */}
        {isEmployee ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 transition-colors">
            <div>
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Self-Service Portal
              </p>
              <h4 className="text-xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">Quick Actions</h4>

              <div className="mt-6 space-y-3">
                <Link
                  to="/tickets/new"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors border border-slate-200 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-3">
                    <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Report IT Issue</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </Link>

                <Link
                  to="/knowledge-base"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors border border-slate-200 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Search Knowledge Base</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>

            <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 transition-colors">
              <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">SUPPORT HOURS</p>
              <p className="text-xs text-indigo-900 dark:text-indigo-200 mt-1 leading-relaxed">
                IT Service Desk is online 24/7. Standard SLA response time is within 2 hours.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col transition-colors">
            <div>
              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Technician Workload
              </p>
              <h4 className="text-xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">Capacity Review</h4>

              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Tier 1 Support Queue</span>
                    <span className="text-rose-600 dark:text-rose-400">88%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[88%]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Network & Infrastructure</span>
                    <span className="text-indigo-600 dark:text-indigo-400">64%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full w-[64%]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Access Management</span>
                    <span className="text-emerald-600 dark:text-emerald-400">40%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[40%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};