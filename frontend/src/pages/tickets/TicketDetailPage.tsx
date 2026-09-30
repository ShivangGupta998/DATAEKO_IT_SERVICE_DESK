import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  RefreshCw,
  History,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { ticketService } from '../../services/ticketService';
import { Ticket, TicketHistoryItem, TicketStatus, TicketPriority } from '../../types/ticket';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { SLAIndicator } from '../../components/tickets/SLAIndicator';
import { TicketTimeline } from '../../components/tickets/TicketTimeline';
import { LoadingSpinner } from '../../components/common/LoadingState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { parseApiError } from '../../api/client';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isManager, isTechnician } = useAuth();
  const { success, error: toastError } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<TicketHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<any>(null);

  // Update Form State
  const [newStatus, setNewStatus] = useState<TicketStatus>('Open');
  const [newPriority, setNewPriority] = useState<TicketPriority>('Medium');
  const [assigneeIdInput, setAssigneeIdInput] = useState<string>('');
  const [commentText, setCommentText] = useState<string>('');

  const fetchTicketDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [ticketData, historyData] = await Promise.all([
        ticketService.getTicketById(id),
        ticketService.getTicketHistory(id).catch(() => []),
      ]);

      setTicket(ticketData);
      setHistory(Array.isArray(historyData) ? historyData : []);

      // Pre-fill form state
      setNewStatus(ticketData.status || 'Open');
      setNewPriority(ticketData.priority || 'Medium');
      setAssigneeIdInput(ticketData.assignee_id ? String(ticketData.assignee_id) : '');
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !ticket) return;

    setIsUpdating(true);
    try {
      const payload: any = {
        status: newStatus,
        priority: newPriority,
      };

      if (isAdmin || isManager) {
        if (assigneeIdInput.trim()) {
          const parsedId = Number(assigneeIdInput.trim());
          if (!isNaN(parsedId)) {
            payload.assignee_id = parsedId;
          }
        } else if (assigneeIdInput === '') {
          payload.assignee_id = null;
        }
      }

      if (commentText.trim()) {
        payload.comment = commentText.trim();
      }

      const updated = await ticketService.updateTicket(id, payload);
      setTicket(updated);
      setCommentText('');
      success('Ticket updated successfully', `Status: ${updated.status}`);

      const freshHistory = await ticketService.getTicketHistory(id).catch(() => []);
      setHistory(freshHistory);
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Update Failed', parsed.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatFullDate = (d?: string) => {
    if (!d) return 'N/A';
    try {
      const isoString = d.endsWith('Z') || d.includes('+') ? d : `${d}Z`;
      return new Date(isoString).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return d;
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" label="Loading ticket details..." />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tickets</span>
        </button>
        <ErrorAlert error={error || 'Ticket not found'} onRetry={fetchTicketDetails} />
      </div>
    );
  }

  return (
    <div className="space-y-6 antialiased transition-colors duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/tickets"
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs dark:shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                #{ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">
              {ticket.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTicketDetails}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs dark:shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-2xl dark:shadow-black/80 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Issue Description</span>
            </h3>
            <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 font-normal">
              {ticket.description || 'No description provided.'}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-2xl dark:shadow-black/80 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Audit Trail & Activity Timeline</span>
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">{history.length} event(s)</span>
            </div>

            <TicketTimeline history={history} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-2xl dark:shadow-black/80 space-y-4 text-xs">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              Ticket Metadata & SLA
            </h3>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                SLA Compliance
              </label>
              <SLAIndicator ticket={ticket} className="w-full justify-center" />
              {ticket.sla_due_date && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center font-medium">
                  Due: {formatFullDate(ticket.sla_due_date)}
                </p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Category:</span>
                <span className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  {ticket.category || 'General'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Requester:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {ticket.requester?.full_name || ticket.requester?.username || ticket.requester_name || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Current Assignee:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {ticket.assignee?.full_name || ticket.assignee?.username || ticket.assignee_name || (
                    <span className="text-slate-400 dark:text-slate-500 italic font-normal">Unassigned</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Created At:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatFullDate(ticket.created_at)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 dark:text-slate-400">Last Updated:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatFullDate(ticket.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {(isAdmin || isManager || isTechnician) && (
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-2xl dark:shadow-black/80 space-y-4 text-xs">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Update Ticket Progress</span>
              </h3>

              <form onSubmit={handleUpdateTicket} className="space-y-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="Open" className="bg-white dark:bg-slate-900">Open</option>
                    <option value="In Progress" className="bg-white dark:bg-slate-900">In Progress</option>
                    <option value="Resolved" className="bg-white dark:bg-slate-900">Resolved</option>
                    <option value="Closed" className="bg-white dark:bg-slate-900">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="Low" className="bg-white dark:bg-slate-900">Low</option>
                    <option value="Medium" className="bg-white dark:bg-slate-900">Medium</option>
                    <option value="High" className="bg-white dark:bg-slate-900">High</option>
                    <option value="Critical" className="bg-white dark:bg-slate-900">Critical</option>
                  </select>
                </div>

                {(isAdmin || isManager) && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                      Assignee User ID
                    </label>
                    <input
                      type="text"
                      value={assigneeIdInput}
                      onChange={(e) => setAssigneeIdInput(e.target.value)}
                      placeholder="e.g. 3 (leave empty for unassigned)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                    Add Internal Note / Comment
                  </label>
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Provide troubleshooting notes or resolution context..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};