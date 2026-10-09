import React, { useEffect, useState, useMemo } from 'react';
import {
  KeyRound,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Shield,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { accessRequestService } from '../../services/accessRequestService';
import { AccessRequest } from '../../types/accessRequest';
import { StatusBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Pagination } from '../../components/common/Pagination';
import { parseApiError } from '../../api/client';

export const AccessRequestListPage: React.FC = () => {
  const { isAdmin, isManager, isTechnician, isEmployee } = useAuth();
  const { success, error: toastError } = useToast();

  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal controls
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input state
  const [systemName, setSystemName] = useState('');
  const [accessType, setAccessType] = useState('Standard Read/Write');
  const [reason, setReason] = useState('');

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: AccessRequest[] = [];
      if (isAdmin || isManager || isTechnician) {
        data = await accessRequestService.getAllRequests();
      } else {
        data = await accessRequestService.getMyRequests();
      }
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [isAdmin, isManager, isTechnician, isEmployee]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemName.trim() || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      await accessRequestService.createRequest({
        system_name: systemName.trim(),
        access_type: accessType.trim(),
        reason: reason.trim(),
      });
      success('Access Request Submitted', `Request for ${systemName} is pending review.`);
      setShowCreateModal(false);
      setSystemName('');
      setAccessType('Standard Read/Write');
      setReason('');
      fetchRequests();
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Submission Failed', parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      await accessRequestService.updateRequest(selectedRequest.id, {
        status: reviewAction,
        admin_notes: adminNotes.trim() || undefined,
      });

      success(
        `Request ${reviewAction}`,
        `Access request for ${selectedRequest.system_name} has been ${reviewAction.toLowerCase()}.`
      );
      setShowReviewModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Review Action Failed', parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSys = (r.system_name || '').toLowerCase().includes(q);
        const matchesUser = (
          r.user?.username ||
          r.user?.full_name ||
          r.user_name ||
          ''
        ).toLowerCase().includes(q);
        const matchesReason = (r.reason || '').toLowerCase().includes(q);
        if (!matchesSys && !matchesUser && !matchesReason) return false;
      }

      if (statusFilter !== 'ALL') {
        if ((r.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [requests, searchQuery, statusFilter]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 transition-colors duration-300 antialiased selection:bg-indigo-500 selection:text-white pb-10">
      {/* Header Banner */}
      <div className="bg-white/80 dark:bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800/60 backdrop-blur-2xl shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <Shield className="w-3 h-3 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            IAM & Provisioning
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <KeyRound className="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Access & Permission Requests</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl font-medium">
            Manage elevated permissions, SaaS application roles, and IAM approvals.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={fetchRequests}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Refresh Access Requests"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Access Request</span>
          </button>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchRequests} />}

      {/* Control Bar */}
      <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl p-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-md dark:shadow-2xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by system, requester, or justification reason..."
            className="w-full pl-11 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-indigo-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold uppercase tracking-wider w-full sm:w-auto focus:ring-2 focus:ring-indigo-500/50 outline-none"
        >
          <option value="ALL">All Request Statuses</option>
          <option value="Pending">Pending Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Main Table Segment */}
      <div className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-lg dark:shadow-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={8} />
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title="No access requests found"
            description="No permission records match your current parameters."
            actionLabel="Request System Access"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100/80 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] font-black border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-4 px-5">Request ID</th>
                    <th className="py-4 px-5">System / Application</th>
                    <th className="py-4 px-5">Access Level</th>
                    <th className="py-4 px-5">Requester</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Date Requested</th>
                    <th className="py-4 px-5">Approver Notes</th>
                    {(isAdmin || isManager) && <th className="py-4 px-5 text-right">Review</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                  {paginatedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-5 font-mono font-black text-indigo-600 dark:text-indigo-400">
                        #{req.id}
                      </td>
                      <td className="py-4 px-5 font-extrabold text-slate-900 dark:text-white text-sm">
                        {req.system_name}
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-700 dark:text-slate-300">
                        {req.access_type}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {req.user?.full_name || req.user?.username || req.user_name || 'Employee'}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-4 px-5 text-slate-500 dark:text-slate-400 font-mono">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="py-4 px-5 max-w-[200px] truncate text-slate-500 dark:text-slate-400 font-normal">
                        {req.admin_notes || req.reason || '—'}
                      </td>

                      {(isAdmin || isManager) && (
                        <td className="py-4 px-5 text-right">
                          {req.status === 'Pending' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequest(req);
                                setReviewAction('Approved');
                                setShowReviewModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-slate-950/80 border border-indigo-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/10 transition-all"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Review</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                              Completed
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredRequests.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Creation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Submit New Access Request"
        subtitle="Request authorization or elevated roles for enterprise applications"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Application / System *
            </label>
            <input
              type="text"
              required
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="e.g. AWS Production Console, GitHub Enterprise, Salesforce"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Access Type / Role Requested *
            </label>
            <select
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium outline-none"
            >
              <option value="Read-Only Viewer">Read-Only Viewer</option>
              <option value="Standard Read/Write">Standard Read/Write</option>
              <option value="Administrator">Administrator / IAM Full</option>
              <option value="Database Direct Access">Database Direct Query</option>
              <option value="VPN Gateway Access">VPN Gateway Access</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Business Justification *
            </label>
            <textarea
              rows={4}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this access is necessary for your role or upcoming project sprint..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={`Review Request #${selectedRequest?.id}: ${selectedRequest?.system_name}`}
        subtitle={`Submitted by ${selectedRequest?.user?.full_name || selectedRequest?.user?.username || 'Employee'}`}
      >
        <form onSubmit={handleReviewRequest} className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">System:</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedRequest?.system_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Access Level:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRequest?.access_type}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Reason:</span>
              <p className="text-slate-700 dark:text-slate-300 italic">{selectedRequest?.reason}</p>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReviewAction('Approved')}
                className={`py-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-all ${
                  reviewAction === 'Approved'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Access</span>
              </button>
              <button
                type="button"
                onClick={() => setReviewAction('Rejected')}
                className={`py-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-all ${
                  reviewAction === 'Rejected'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                    : 'bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Access</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reviewer Notes / Provisioning Confirmation
            </label>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Approved per Manager approval in ticket #420. IAM group assigned."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 font-bold uppercase tracking-wider text-white rounded-xl shadow-lg transition-all disabled:opacity-50 ${
                reviewAction === 'Approved'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              }`}
            >
              {isSubmitting ? 'Saving...' : `Confirm ${reviewAction}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};