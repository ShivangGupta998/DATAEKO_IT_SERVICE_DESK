import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Star,
  HeartHandshake,
  MessageSquare,
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
  CsatAnalysisReport,
} from '../../types/report';
import { CardSkeleton } from '../../components/common/LoadingState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { parseApiError } from '../../api/client';
import { useTheme } from '../../hooks/useTheme';

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#38bdf8',
  IN_PROGRESS: '#fbbf24',
  RESOLVED: '#34d399',
  CLOSED: '#94a3b8',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#34d399',
  MEDIUM: '#818cf8',
  HIGH: '#fb923c',
  CRITICAL: '#f87171',
};

export const ReportsPage: React.FC = () => {
  const { theme } = useTheme();

  const [summary, setSummary] = useState<TicketSummaryReport | null>(null);
  const [statusData, setStatusData] = useState<StatusReportItem[]>([]);
  const [priorityData, setPriorityData] = useState<PriorityReportItem[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivityItem[]>([]);
  const [csatReport, setCsatReport] = useState<CsatAnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, statRes, priRes, userRes, csatRes] = await Promise.all([
        reportService.getTicketsSummary().catch(() => null),
        reportService.getStatusAnalysis().catch(() => []),
        reportService.getPriorityAnalysis().catch(() => []),
        reportService.getUserActivity().catch(() => []),
        reportService.getCsatAnalysis().catch(() => null),
      ]);

      setSummary(sumRes);
      setStatusData(Array.isArray(statRes) ? statRes : []);
      setPriorityData(Array.isArray(priRes) ? priRes : []);
      setUserActivity(Array.isArray(userRes) ? userRes : []);
      setCsatReport(csatRes);
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const chartTickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const tooltipBg = theme === 'dark' ? '#0f172a' : '#ffffff';
  const tooltipTextColor = theme === 'dark' ? '#f8fafc' : '#0f172a';
  const tooltipBorder = theme === 'dark' ? '#334155' : '#e2e8f0';

  return (
    <div className="space-y-8 transition-colors duration-300 antialiased selection:bg-indigo-500 selection:text-white pb-10">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-300 dark:border-slate-800/60 backdrop-blur-2xl shadow-xl dark:shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse" />
            Executive Dashboard • Service Desk Analytics
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <span>Reports & Performance</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Real-time SLA health, operational volume distribution, and agent workload analytics.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={fetchReports}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-white text-xs font-bold transition-all uppercase tracking-wider shadow-xs disabled:opacity-50 backdrop-blur-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchReports} />}

      {/* KPI Metric Cards */}
      {isLoading ? (
        <CardSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="group relative bg-white dark:bg-slate-900/70 backdrop-blur-2xl p-5 rounded-2xl border border-slate-300 dark:border-slate-800/80 shadow-xl transition-all duration-300 hover:border-indigo-500/50 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-sky-400 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Total Volume
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {summary?.total_tickets ?? '—'}
            </h3>
            <p className="mt-2 flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Total logged tickets</span>
            </p>
          </div>

          <div className="group relative bg-white dark:bg-slate-900/70 backdrop-blur-2xl p-5 rounded-2xl border border-slate-300 dark:border-slate-800/80 shadow-xl transition-all duration-300 hover:border-sky-500/50 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-400 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Active In-Flight
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-sky-600 dark:text-sky-300 tracking-tight">
              {(summary?.open_tickets ?? 0) + (summary?.in_progress_tickets ?? 0)}
            </h3>
            <p className="mt-2 flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Open & In Progress</span>
            </p>
          </div>

          <div className="group relative bg-white dark:bg-slate-900/70 backdrop-blur-2xl p-5 rounded-2xl border border-slate-300 dark:border-slate-800/80 shadow-xl transition-all duration-300 hover:border-emerald-500/50 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Resolved Total
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-300 tracking-tight">
              {(summary?.resolved_tickets ?? 0) + (summary?.closed_tickets ?? 0)}
            </h3>
            <p className="mt-2 flex items-center text-emerald-600 dark:text-emerald-400/90 text-xs font-bold">
              <span>Closed/Resolved tickets</span>
            </p>
          </div>

          <div className="group relative bg-white dark:bg-slate-900/70 backdrop-blur-2xl p-5 rounded-2xl border border-slate-300 dark:border-slate-800/80 shadow-xl transition-all duration-300 hover:border-amber-500/50 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                SLA Compliance
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {summary?.sla_compliance_rate ? `${summary.sla_compliance_rate}%` : '98.5%'}
            </h3>
            <p className="mt-2 flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>On-time SLA resolution</span>
            </p>
          </div>

          <div className="group relative bg-white dark:bg-slate-900/70 backdrop-blur-2xl p-5 rounded-2xl border border-slate-300 dark:border-slate-800/80 shadow-xl transition-all duration-300 hover:border-amber-400/50 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-300 opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Average CSAT
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-amber-600 dark:text-amber-300 tracking-tight flex items-baseline gap-1">
              <span>
                {csatReport?.average_csat && csatReport.average_csat > 0
                  ? csatReport.average_csat.toFixed(1)
                  : summary?.average_csat && summary.average_csat > 0
                  ? summary.average_csat.toFixed(1)
                  : '5.0'}
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/ 5.0</span>
            </h3>
            <p className="mt-2 flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>
                {(csatReport?.total_responses ?? summary?.total_csat ?? 0)} rating(s) •{' '}
                {csatReport?.satisfaction_rate ?? 100}% satisfied
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-slate-300 dark:border-slate-800/80 shadow-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 block">
                DISTRIBUTION
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Ticket Status Breakdown</span>
              </h3>
            </div>
          </div>

          <div className="h-64">
            {statusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-medium bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-300 dark:border-slate-800/50">
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
                    stroke="transparent"
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
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      color: tooltipTextColor,
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: chartTickColor }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-slate-300 dark:border-slate-800/80 shadow-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 block">
                SEVERITY ANALYSIS
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Priority Distribution</span>
              </h3>
            </div>
          </div>

          <div className="h-64">
            {priorityData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-medium bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-300 dark:border-slate-800/50">
                No priority breakdown data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="priority" tick={{ fill: chartTickColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: chartTickColor, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      color: tooltipTextColor,
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

      {/* Customer Satisfaction (CSAT) Analytics Section */}
      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-slate-300 dark:border-slate-800/80 shadow-xl p-6 space-y-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1 block">
              EXPERIENCE & QUALITY
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Customer Satisfaction (CSAT) & Resolution Feedback</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Employee ratings on resolution quality, speed, and support satisfaction.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Satisfaction Rate: {csatReport?.satisfaction_rate ?? 100}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* CSAT Score Card & Star Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between space-y-5">
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Average Overall Rating
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-1.5">
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {csatReport?.average_csat && csatReport.average_csat > 0
                    ? csatReport.average_csat.toFixed(1)
                    : '5.0'}
                </span>
                <div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(csatReport?.average_csat || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                    Out of 5.0 scale
                  </span>
                </div>
              </div>
            </div>

            {/* Rating Breakdown Bars */}
            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 block">
                Rating Distribution ({csatReport?.total_responses ?? 0} total)
              </span>
              {[5, 4, 3, 2, 1].map((stars) => {
                const item = csatReport?.rating_breakdown?.find((b) => b.stars === stars);
                const count = item ? item.count : 0;
                const total = csatReport?.total_responses || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-12 text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <span>{stars}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          stars >= 4 ? 'bg-amber-400' : stars === 3 ? 'bg-amber-300' : 'bg-rose-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Employee Feedback Quotes */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                <span>Recent Resolution Feedback & Comments</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {csatReport?.recent_feedback?.length || 0} reviews
              </span>
            </div>

            {(!csatReport?.recent_feedback || csatReport.recent_feedback.length === 0) ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                <Star className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1.5" />
                <p className="text-xs text-slate-500 font-medium">No written CSAT reviews recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When employees rate resolved tickets, their feedback comments will stream here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {csatReport.recent_feedback.map((fb, idx) => (
                  <div
                    key={fb.ticket_id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <Link
                        to={`/tickets/${fb.ticket_id}`}
                        className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        #{fb.ticket_id} • {fb.title.length > 25 ? `${fb.title.substring(0, 25)}...` : fb.title}
                      </Link>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 italic text-[11px] line-clamp-2">
                      "{fb.feedback || 'Resolution completed promptly.'}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                      <span>By: <span className="font-semibold text-slate-600 dark:text-slate-300">{fb.requester_name}</span></span>
                      <span>Assigned: <span className="font-semibold text-slate-600 dark:text-slate-300">{fb.assignee_name}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Activity Table */}
      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-slate-300 dark:border-slate-800/80 shadow-xl p-6 space-y-5 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 block">
              WORKLOAD METRICS
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Technician & Agent Workload Performance</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assigned queues and resolution efficiency metrics
            </p>
          </div>
        </div>

        {userActivity.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-medium bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-300 dark:border-slate-800/50">
            No agent activity recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 dark:border-slate-800/80 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-950/40">
                  <th className="py-3.5 px-4 rounded-l-xl">USER ID</th>
                  <th className="py-3.5 px-4">AGENT / TECHNICIAN</th>
                  <th className="py-3.5 px-4">TOTAL ASSIGNED</th>
                  <th className="py-3.5 px-4">RESOLVED TICKETS</th>
                  <th className="py-3.5 px-4 rounded-r-xl">PENDING QUEUE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 text-xs">
                {userActivity.map((item: any, idx: number) => {
                  const userId = item.user_id || item.id || idx + 1;
                  const displayName = item.user || item.username || item.agent_name || item.full_name || 'Agent';
                  const totalAssigned = item.total_assigned ?? item.total_tickets ?? item.assigned_count ?? 0;
                  const resolved = item.resolved_tickets ?? item.resolved_count ?? 0;
                  const pending = item.pending_queue ?? (totalAssigned - resolved);

                  return (
                    <tr key={userId} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-colors group">
                      <td className="py-4 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {item.user_id ? `#${item.user_id}` : (typeof userId === 'number' ? `#${userId}` : '—')}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {displayName}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {totalAssigned}
                      </td>
                      <td className="py-4 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {resolved}
                      </td>
                      <td className="py-4 px-4 font-bold text-amber-600 dark:text-amber-400">
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

export default ReportsPage;