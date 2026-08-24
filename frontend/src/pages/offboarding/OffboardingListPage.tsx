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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserX className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Employee Offboarding & Deprovisioning</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track asset returns, security access revocation, and IT departure workflows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchRecords}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {(isAdmin || isManager) && (
            <button
              type="button"
              onClick={() => setShowInitiateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Offboarding</span>
            </button>
          )}
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchRecords} />}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by departing employee, notes..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium w-full sm:w-auto"
        >
          <option value="ALL">All Offboarding Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Offboarding Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
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
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Departing Employee</th>
                    <th className="py-3 px-4">Departure Date</th>
                    <th className="py-3 px-4">Assets Returned</th>
                    <th className="py-3 px-4">Access Revoked</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                    {(isAdmin || isManager) && <th className="py-3 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {paginatedRecords.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        #{item.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.user?.full_name || item.user?.username || item.user_name || `User #${item.user_id}`}
                        </div>
                        {item.user?.email && <div className="text-[10px] text-slate-400">{item.user.email}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {formatDate(item.departure_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.assets_returned ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Returned</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.access_revoked ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Revoked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3.5 px-4 max-w-[180px] truncate text-slate-500">
                        {item.notes || '—'}
                      </td>

                      {(isAdmin || isManager) && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenUpdate(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
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
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
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
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowInitiateModal(false)}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs disabled:opacity-50"
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
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={assetsReturned}
                onChange={(e) => setAssetsReturned(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">All IT Assets Returned</p>
                <p className="text-[11px] text-slate-500">Laptop, charger, badge, monitors returned to IT</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={accessRevoked}
                onChange={(e) => setAccessRevoked(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">All System Access Revoked</p>
                <p className="text-[11px] text-slate-500">SSO disabled, VPN revoked, cloud credentials rotated</p>
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
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
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
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowUpdateModal(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Progress'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};