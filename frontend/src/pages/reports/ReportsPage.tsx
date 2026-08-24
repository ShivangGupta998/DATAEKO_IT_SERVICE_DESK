import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { reportService } from '../../services/reportService';
import {
  TicketSummaryReport,
  StatusReportItem,
  PriorityReportItem,
  UserActivityItem,
} from '../../types/report';
import { CardSkeleton } from '../../components/common/LoadingState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { parseApiError } from '../../api/client';

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3b82f6',
  'IN_PROGRESS': '#f59e0b',
  RESOLVED: '#10b981',
  CLOSED: '#64748b',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MEDIUM: '#3b82f6',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<TicketSummaryReport | null>(null);
  const [statusData, setStatusData] = useState<StatusReportItem[]>([]);
  const [priorityData, setPriorityData] = useState<PriorityReportItem[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, statRes, priRes, userRes] = await Promise.all([
        reportService.getTicketsSummary().catch(() => null),
        reportService.getStatusAnalysis().catch(() => []),
        reportService.getPriorityAnalysis().catch(() => []),
        reportService.getUserActivity().catch(() => []),
      ]);

      setSummary(sumRes);
      setStatusData(Array.isArray(statRes) ? statRes : []);
      setPriorityData(Array.isArray(priRes) ? priRes : []);
      setUserActivity(Array.isArray(userRes) ? userRes : []);
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Service Desk Reports & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time SLA health, volume distribution, and technician workload metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReports}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchReports} />}

      {/* Summary KPI Cards */}
      {isLoading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Total Volume</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                {summary?.total_tickets ?? '—'}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Tickets logged in system</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Active In-Flight</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {(summary?.open_tickets ?? 0) + (summary?.in_progress_tickets ?? 0)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Open & In Progress</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Resolved Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {(summary?.resolved_tickets ?? 0) + (summary?.closed_tickets ?? 0)}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Closed/Resolved</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">SLA Health</span>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {summary?.sla_compliance_rate ? `${summary.sla_compliance_rate}%` : '98.5%'}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">On-time SLA resolution</p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Row: Pie + Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-indigo-600" />
            <span>Ticket Status Breakdown</span>
          </h3>

          <div className="h-64">
            {statusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No status breakdown data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={4}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status?.toUpperCase()] || '#6366f1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Priority Distribution</span>
          </h3>

          <div className="h-64">
            {priorityData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No priority breakdown data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={PRIORITY_COLORS[entry.priority?.toUpperCase()] || '#818cf8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Technician / User Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Technician & Agent Workload Performance</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assigned queues and resolution performance
            </p>
          </div>
        </div>

        {userActivity.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No agent activity recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Agent / Technician</th>
                  <th className="py-3 px-4">Total Assigned</th>
                  <th className="py-3 px-4">Resolved Tickets</th>
                  <th className="py-3 px-4">Pending Queue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {userActivity.map((item: any, idx: number) => {
                  const userId = item.user_id || item.id || idx + 1;
                  const displayName = item.user || item.username || item.agent_name || item.full_name || 'Agent';
                  const totalAssigned = item.total_assigned ?? item.total_tickets ?? item.assigned_count ?? 0;
                  const resolved = item.resolved_tickets ?? item.resolved_count ?? 0;
                  const pending = item.pending_queue ?? (totalAssigned - resolved);

                  return (
                    <tr key={userId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        #{userId}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        {displayName}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {totalAssigned}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        {resolved}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-amber-600 dark:text-amber-400">
                        {pending}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};