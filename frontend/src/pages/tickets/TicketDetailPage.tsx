import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User as UserIcon,
  Tag,
  Shield,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  History,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ticketService } from '../../services/ticketService';
import { Ticket, TicketHistoryItem, TicketStatus, TicketPriority } from '../../types/ticket';
import { StatusBadge, PriorityBadge, SLABadge } from '../../components/common/Badge';
import { SLAIndicator } from '../../components/tickets/SLAIndicator';
import { TicketTimeline } from '../../components/tickets/TicketTimeline';
import { LoadingSpinner } from '../../components/common/LoadingState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { parseApiError } from '../../api/client';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, roleId, isAdmin, isManager, isTechnician, isEmployee } = useAuth();
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

      // Only Admin and Manager are allowed to assign/reassign tickets
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

      // Refresh history
      const freshHistory = await ticketService.getTicketHistory(id).catch(() => []);
      setHistory(freshHistory);
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Update Failed', parsed.message);
    } finally {
      setIsUpdating(false);
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
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tickets</span>
        </button>
        <ErrorAlert error={error || 'Ticket not found'} onRetry={fetchTicketDetails} />
      </div>
    );
  }

  const formatFullDate = (d?: string) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/tickets"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                #{ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              {ticket.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTicketDetails}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Details & Timeline, Right is Ticket Attributes & Update Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Description & History Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Issue Description</span>
            </h3>
            <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 font-normal">
              {ticket.description || 'No description provided.'}
            </div>
          </div>

          {/* Ticket History / Timeline */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Audit Trail & Activity Timeline</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">{history.length} event(s)</span>
            </div>

            <TicketTimeline history={history} />
          </div>
        </div>

        {/* Right Column: Meta Info & Role-Based Actions */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Ticket Metadata & SLA
            </h3>

            {/* SLA Status Indicator */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                SLA Compliance
              </label>
              <SLAIndicator ticket={ticket} className="w-full justify-center" />
              {ticket.sla_due_date && (
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  Due: {formatFullDate(ticket.sla_due_date)}
                </p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {ticket.category || 'General'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Requester:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {ticket.requester?.full_name || ticket.requester?.username || ticket.requester_name || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Current Assignee:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {ticket.assignee?.full_name || ticket.assignee?.username || ticket.assignee_name || (
                    <span className="text-slate-400 italic font-normal">Unassigned</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Source:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {ticket.source || 'Portal'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Created:</span>
                <span className="text-slate-700 dark:text-slate-300">{formatFullDate(ticket.created_at)}</span>
              </div>

              {ticket.updated_at && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500">Last Updated:</span>
                  <span className="text-slate-700 dark:text-slate-300">{formatFullDate(ticket.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Role-Based Controls */}

          {/* Employee: View-only Notice */}
          {isEmployee && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-2">
              <Lock className="w-5 h-5 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                You have view-only access to this ticket.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Support agents and technicians will update the ticket as resolution progresses.
              </p>
            </div>
          )}

          {/* Admin / Manager / Technician: Update Ticket Form */}
          {(isAdmin || isManager || isTechnician) && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>{isAdmin || isManager ? 'Manage & Assign Ticket' : 'Update Assigned Ticket'}</span>
              </h3>

              <form onSubmit={handleUpdateTicket} className="space-y-4 text-xs">
                {/* Status Selector */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Update Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Priority Selector */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Update Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* Assignee Control - Strictly visible ONLY for Admin & Manager */}
                {(isAdmin || isManager) && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Assignee Technician (User ID)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Role 1 / 2 Only</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={assigneeIdInput}
                        onChange={(e) => setAssigneeIdInput(e.target.value)}
                        placeholder="e.g. 3 (Technician User ID) or blank"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Leave blank to unassign or enter the Technician's user ID.
                    </p>
                  </div>
                )}

                {/* Comment / Progress Note */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Resolution Comment / Work Note
                  </label>
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Provide diagnostic steps, RCA notes, or resolution update..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xs"
                >
                  {isUpdating ? (
                    <span>Saving Changes...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Update Ticket</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
