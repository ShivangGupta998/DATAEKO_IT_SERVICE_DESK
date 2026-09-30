import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  Laptop,
  KeyRound,
  BookOpen,
  ArrowUpRight,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
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
    <div className="space-y-8 transition-colors duration-300 antialiased selection:bg-indigo-500 selection:text-white pb-10">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/60 dark:backdrop-blur-2xl shadow-sm dark:shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
            {roleName || 'User'} Workspace • Enterprise Insights
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {isEmployee ? 'My Helpdesk Hub' : isTechnician ? 'Technician Queue' : 'System Overview'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Welcome back, <span className="text-slate-800 dark:text-slate-200 font-bold">{user?.full_name || user?.username || 'Team Member'}</span>. Here is your operational summary.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          {isEmployee && (
            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all uppercase tracking-wider shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Ticket</span>
            </Link>
          )}
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all uppercase tracking-wider shadow-xs hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchDashboardData} />}

      {/* Metric Cards */}
      {isLoading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Active Tickets / Requests */}
          <div className="group relative bg-white dark:bg-slate-900/70 dark:backdrop-blur-2xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl dark:shadow-black/50 transition-all duration-300 hover:border-emerald-500/50 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {isEmployee ? 'Active Requests' : 'Active Tickets'}
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.open + stats.inProgress}
            </h3>
            <p className="mt-2 flex items-center text-emerald-600 dark:text-emerald-400/90 text-xs font-semibold">
              <span className="inline-block mr-1">↑</span> Active in queue
              <span className="text-slate-400 dark:text-slate-400 ml-1 font-normal">({stats.total} total)</span>
            </p>
          </div>

          {/* SLA At Risk / In Progress */}
          <div className="group relative bg-white dark:bg-slate-900/70 dark:backdrop-blur-2xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl dark:shadow-black/50 transition-all duration-300 hover:border-amber-500/50 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {isEmployee ? 'In Progress' : 'SLA At Risk'}
              </span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {isEmployee ? stats.inProgress : stats.slaAtRisk}
            </h3>
            <p className="mt-2 flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>{isEmployee ? 'Being worked on' : 'Response time < 1hr'}</span>
            </p>
          </div>

          {/* SLA Breached / Needs Attention */}
          <div className="group relative bg-white dark:bg-slate-900/70 dark:backdrop-blur-2xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl dark:shadow-black/50 transition-all duration-300 hover:border-rose-500/50 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-400 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                {isEmployee ? 'Needs Attention' : 'SLA Breached'}
              </span>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {isEmployee ? stats.critical : stats.slaBreached.toString().padStart(2, '0')}
            </h3>
            <p className="mt-2 flex items-center text-rose-600 dark:text-rose-400/90 text-xs font-bold">
              <span>{isEmployee ? 'High/Critical priority' : 'Immediate action required'}</span>
            </p>
          </div>

          {/* Resolved Total */}
          <div className="group relative bg-white dark:bg-slate-900/70 dark:backdrop-blur-2xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl dark:shadow-black/50 transition-all duration-300 hover:border-indigo-500/50 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-sky-400 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {isEmployee ? 'Resolved Requests' : 'Resolved Total'}
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-indigo-300 tracking-tight">
              {stats.resolved}
            </h3>
            <p className="mt-2 flex items-center text-indigo-600 dark:text-indigo-400/90 text-xs font-bold">
              <span>Completed tickets</span>
            </p>
          </div>
        </div>
      )}

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/70 dark:backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-2xl dark:shadow-black/50 flex flex-col overflow-hidden transition-all p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white tracking-wide">
                {isEmployee ? 'My Active Requests' : isTechnician ? 'My Assigned Queue' : 'Recent Escalations'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEmployee ? 'Track your active support requests in real-time' : 'Tickets requiring immediate action'}
              </p>
            </div>
            <Link
              to="/tickets"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800/50">
              No tickets found in queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800/80 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-950/40">
                    <th className="py-3.5 px-4 rounded-l-xl">TICKET ID</th>
                    <th className="py-3.5 px-4">SUBJECT</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4">PRIORITY</th>
                    <th className="py-3.5 px-4 rounded-r-xl text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                  {recentTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-indigo-500/10 transition-colors group">
                      <td className="py-4 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        #{ticket.id}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                        {ticket.title}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="py-4 px-4">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Sidebar Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/70 dark:backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xs dark:shadow-2xl dark:shadow-black/50 space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Quick Shortcuts
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => navigate('/tickets/new')}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-left transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Hardware & Software</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Request devices or software access</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/tickets/new')}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-left transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Account & Access</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Password resets and permissions</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/kb')}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-left transition-all group"
              >
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Knowledge Base</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Self-help guides and FAQs</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};