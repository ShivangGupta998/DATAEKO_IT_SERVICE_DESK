import React, { useEffect, useState, useMemo } from 'react';
import {
  UserX,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Edit,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { offboardingService, InitiateOffboardingPayload } from '../../services/offboardingService';
import { Offboarding, OffboardingStatus } from '../../types/offboarding';
import { StatusBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Pagination } from '../../components/common/Pagination';
import { parseApiError } from '../../api/client';

export const OffboardingListPage: React.FC = () => {
  const { isAdmin, isManager, isEmployee } = useAuth();
  const { success, error: toastError } = useToast();

  const [records, setRecords] = useState<Offboarding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Offboarding | null>(null);

  // Initiate form state
  const [targetUserId, setTargetUserId] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [initiateNotes, setInitiateNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update progress state
  const [assetsReturned, setAssetsReturned] = useState(false);
  const [accessRevoked, setAccessRevoked] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<OffboardingStatus>('In Progress');
  const [updateNotes, setUpdateNotes] = useState('');

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: Offboarding[] = [];
      if (isAdmin || isManager) {
        data = await offboardingService.getAllOffboarding();
      } else {
        const myRecord = await offboardingService.getMyOffboarding();
        data = myRecord ? [myRecord] : [];
      }
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [isAdmin, isManager, isEmployee]);

  const handleInitiateOffboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: InitiateOffboardingPayload = {
        user_id: Number(targetUserId.trim()),
      };

      if (departureDate.trim()) {
        payload.departure_date = departureDate;
      }

      if (initiateNotes.trim()) {
        payload.notes = initiateNotes.trim();
      }

      await offboardingService.initiateOffboarding(payload);

      success('Offboarding Initiated', `Offboarding process for User #${targetUserId} has been logged.`);
      setShowInitiateModal(false);
      setTargetUserId('');
      setDepartureDate('');
      setInitiateNotes('');
      fetchRecords();
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Initiation Failed', parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenUpdate = (record: Offboarding) => {
    setSelectedRecord(record);
    setAssetsReturned(record.assets_returned || false);
    setAccessRevoked(record.access_revoked || false);
    setUpdateStatus(record.status || 'In Progress');
    setUpdateNotes(record.notes || '');
    setShowUpdateModal(true);
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setIsSubmitting(true);
    try {
      await offboardingService.updateOffboarding(selectedRecord.id, {
        assets_returned: assetsReturned,
        access_revoked: accessRevoked,
        status: updateStatus,
        notes: updateNotes.trim() || undefined,
      });

      success('Checklist Updated', `Offboarding record #${selectedRecord.id} saved.`);
      setShowUpdateModal(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Update Failed', parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUser = (r.user?.username || r.user?.full_name || r.user_name || '').toLowerCase().includes(q);
        const matchesNotes = (r.notes || '').toLowerCase().includes(q);
        if (!matchesUser && !matchesNotes) return false;
      }

      if (statusFilter !== 'ALL') {
        if ((r.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [records, searchQuery, statusFilter]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

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
      {/* Top Banner / Header */}
      <div className="bg-white dark:bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/60 dark:backdrop-blur-2xl shadow-sm dark:shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest">
            <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400 animate-pulse" />
            Deprovisioning Protocol
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <UserX className="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Employee Offboarding</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl font-medium">
            Track asset returns, security access revocation, and IT departure workflows.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={fetchRecords}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-all shadow-xs active:scale-95 disabled:opacity-50"
            title="Refresh Offboarding Records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
          </button>

          {(isAdmin || isManager) && (
            <button
              type="button"
              onClick={() => setShowInitiateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Offboarding</span>
            </button>
          )}
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchRecords} />}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900/70 dark:backdrop-blur-2xl p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-2xl dark:shadow-black/50 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by departing employee, notes..."
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
          <option value="ALL">All Offboarding Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Offboarding Table */}
      <div className="bg-white dark:bg-slate-900/70 dark:backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-2xl dark:shadow-black/50 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={6} />
          </div>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            title="No offboarding records"
            description="There are currently no active deprovisioning workflows."
            actionLabel={isAdmin || isManager ? 'Initiate Process' : undefined}
            onAction={isAdmin || isManager ? () => setShowInitiateModal(true) : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] font-black border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-4 px-5">ID</th>
                    <th className="py-4 px-5">Departing Employee</th>
                    <th className="py-4 px-5">Departure Date</th>
                    <th className="py-4 px-5">Assets Returned</th>
                    <th className="py-4 px-5">Access Revoked</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Notes</th>
                    {(isAdmin || isManager) && <th className="py-4 px-5 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {paginatedRecords.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-5 font-mono font-black text-indigo-600 dark:text-indigo-400">
                        #{item.id}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {item.user?.full_name || item.user?.username || item.user_name || `User #${item.user_id}`}
                        </div>
                        {item.user?.email && <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.user.email}</div>}
                      </td>
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-300 font-mono">
                        {formatDate(item.departure_date)}
                      </td>
                      <td className="py-4 px-5">
                        {item.assets_returned ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Returned</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {item.access_revoked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Revoked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 font-bold text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-4 px-5 max-w-[180px] truncate text-slate-500 dark:text-slate-400 font-normal">
                        {item.notes || '—'}
                      </td>

                      {(isAdmin || isManager) && (
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenUpdate(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Update</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredRecords.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Initiate Modal */}
      <Modal
        isOpen={showInitiateModal}
        onClose={() => setShowInitiateModal(false)}
        title="Initiate Offboarding Workflow"
        subtitle="Log employee departure and track deprovisioning checklist"
      >
        <form onSubmit={handleInitiateOffboarding} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Departing Employee (User ID) *
            </label>
            <input
              type="number"
              required
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="e.g. 5"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Last Working Day / Departure Date
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Departure Notes & Handover Instructions
            </label>
            <textarea
              rows={3}
              value={initiateNotes}
              onChange={(e) => setInitiateNotes(e.target.value)}
              placeholder="e.g. Hardware return scheduled for Friday. Forward email to manager."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowInitiateModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Starting...' : 'Start Offboarding'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Progress Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title={`Update Offboarding Progress: #${selectedRecord?.id}`}
        subtitle={`Tracking deprovisioning for ${selectedRecord?.user?.full_name || selectedRecord?.user?.username || `User #${selectedRecord?.user_id}`}`}
      >
        <form onSubmit={handleUpdateProgress} className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={assetsReturned}
                onChange={(e) => setAssetsReturned(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500/50"
              />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">All IT Assets Returned</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Laptop, charger, badge, monitors returned to IT</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={accessRevoked}
                onChange={(e) => setAccessRevoked(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500/50"
              />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">All System Access Revoked</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">SSO disabled, VPN revoked, cloud credentials rotated</p>
              </div>
            </label>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Workflow Status
            </label>
            <select
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value as OffboardingStatus)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-medium transition-all outline-none"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Progress Notes / Confirmation
            </label>
            <textarea
              rows={3}
              value={updateNotes}
              onChange={(e) => setUpdateNotes(e.target.value)}
              placeholder="e.g. Asset tag AST-2026-09 returned. All accounts disabled in Okta."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowUpdateModal(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Progress'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};