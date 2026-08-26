import React, { useEffect, useState, useMemo } from 'react';
import {
  Laptop,
  Search,
  Plus,
  UserCheck,
  Ban,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { assetService } from '../../services/assetService';
import { Asset } from '../../types/asset';
import { StatusBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Pagination } from '../../components/common/Pagination';
import { parseApiError } from '../../api/client';

export const AssetListPage: React.FC = () => {
  const { isAdmin, isManager, isTechnician, isEmployee } = useAuth();
  const { success, error: toastError } = useToast();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRetireConfirm, setShowRetireConfirm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Create form state
  const [assetTag, setAssetTag] = useState('');
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState('Laptop');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [cost, setCost] = useState<string>('');
  const [location, setLocation] = useState('HQ - 3rd Floor');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign form state
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // Admin, Manager, and Technician can create, assign, and retire assets
  const canManageAssets = isAdmin || isManager || isTechnician;

  const fetchAssets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: Asset[] = [];
      if (canManageAssets) {
        data = await assetService.getAllAssets();
      } else {
        data = await assetService.getMyAssets();
      }
      setAssets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [isAdmin, isManager, isTechnician, isEmployee]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetTag.trim() || !assetName.trim()) return;

    setIsSubmitting(true);
    try {
      await assetService.createAsset({
        asset_tag: assetTag.trim(),
        name: assetName.trim(),
        category,
        model: model.trim() || undefined,
        serial_number: serialNumber.trim() || undefined,
        cost: cost !== '' ? parseFloat(cost) : undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      success('Asset Created', `${assetTag} registered successfully.`);
      setShowCreateModal(false);
      // Reset form
      setAssetTag('');
      setAssetName('');
      setModel('');
      setSerialNumber('');
      setCost('');
      setNotes('');
      fetchAssets();
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Asset Creation Failed', parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !assigneeUserId.trim()) return;

    setIsSubmitting(true);
    try {
      await assetService.assignAsset(selectedAsset.id, {
        assigned_to: parseInt(assigneeUserId.trim(), 10),
        notes: assignNotes.trim() || undefined,
      });
      success('Asset Assigned', `${selectedAsset.asset_tag} assigned to User #${assigneeUserId}.`);
      setShowAssignModal(false);
      setSelectedAsset(null);
      setAssigneeUserId('');
      setAssignNotes('');
      fetchAssets();
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Assignment Failed', parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetireAsset = async () => {
    if (!selectedAsset) return;
    setIsSubmitting(true);
    try {
      await assetService.retireAsset(selectedAsset.id);
      success('Asset Retired', `${selectedAsset.asset_tag} has been retired.`);
      setShowRetireConfirm(false);
      setSelectedAsset(null);
      fetchAssets();
    } catch (err: any) {
      const parsed = parseApiError(err);
      toastError('Retirement Failed', parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTag = (a.asset_tag || '').toLowerCase().includes(q);
        const matchesName = (a.name || '').toLowerCase().includes(q);
        const matchesSerial = (a.serial_number || '').toLowerCase().includes(q);
        const matchesModel = (a.model || '').toLowerCase().includes(q);
        const matchesAssignee = (a.assigned_to?.username || a.assigned_to_name || '').toLowerCase().includes(q);
        if (!matchesTag && !matchesName && !matchesSerial && !matchesModel && !matchesAssignee) {
          return false;
        }
      }

      if (statusFilter !== 'ALL') {
        if ((a.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [assets, searchQuery, statusFilter]);

  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Laptop className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>IT Asset Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track enterprise hardware, serial inventory, costs, assignments, and device lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAssets}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {canManageAssets && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Asset</span>
            </button>
          )}
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchAssets} />}

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
            placeholder="Search by tag, name, model, serial number, assignee..."
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
          <option value="ALL">All Asset Statuses</option>
          <option value="Available">Available</option>
          <option value="Assigned">Assigned</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Retired">Retired</option>
        </select>
      </div>

      {/* Assets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={canManageAssets ? 9 : 8} />
          </div>
        ) : filteredAssets.length === 0 ? (
          <EmptyState
            title="No assets found"
            description="No asset records match your criteria."
            actionLabel={canManageAssets ? 'Add Asset' : undefined}
            onAction={canManageAssets ? () => setShowCreateModal(true) : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Asset Tag</th>
                    <th className="py-3 px-4">Name & Model</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">Cost</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Location</th>
                    {canManageAssets && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {paginatedAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {asset.asset_tag}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{asset.name}</div>
                        {asset.model && <div className="text-[10px] text-slate-400">{asset.model}</div>}
                      </td>
                      <td className="py-3.5 px-4">{asset.category || 'General'}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {asset.serial_number || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                        {asset.cost !== undefined && asset.cost !== null ? `$${asset.cost.toLocaleString()}` : '$0.00'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={asset.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {asset.assigned_to ? (
                          <div className="font-medium text-slate-900 dark:text-white">
                            {asset.assigned_to.full_name || asset.assigned_to.username}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{asset.location || 'N/A'}</td>

                      {canManageAssets && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {asset.status !== 'Retired' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setShowAssignModal(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                                title="Assign to Employee"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}

                            {asset.status !== 'Retired' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setShowRetireConfirm(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                title="Retire Asset"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredAssets.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Create Asset Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register New IT Asset"
        subtitle="Add a new hardware device or equipment to inventory"
      >
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Asset Tag / Barcode *
              </label>
              <input
                type="text"
                required
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                placeholder="e.g. AST-2026-09"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Laptop">Laptop / Workstation</option>
                <option value="Monitor">Monitor / Display</option>
                <option value="Phone">Mobile Device / Phone</option>
                <option value="Peripheral">Peripheral / Dock</option>
                <option value="Network">Networking Device</option>
                <option value="Server">Server Unit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Asset Name / Title *
            </label>
            <input
              type="text"
              required
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g. MacBook Pro 16-inch M3 Max"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="A2991"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="C02XXXXXXXX"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cost ($)
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="1200.00"
                  className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Physical Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. IT Storage Room B"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Register Asset'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Asset Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign Asset: ${selectedAsset?.asset_tag}`}
        subtitle={`Assign ${selectedAsset?.name} to an active employee`}
      >
        <form onSubmit={handleAssignAsset} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assignee Employee (User ID) *
            </label>
            <input
              type="number"
              required
              value={assigneeUserId}
              onChange={(e) => setAssigneeUserId(e.target.value)}
              placeholder="e.g. 5"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">Enter the recipient employee's user ID.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assignment Notes / Handover Details
            </label>
            <textarea
              rows={3}
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="e.g. Handed over on first day with power adapter and security lock."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Retire Confirm Dialog */}
      <ConfirmDialog
        isOpen={showRetireConfirm}
        onClose={() => setShowRetireConfirm(false)}
        onConfirm={handleRetireAsset}
        title="Retire Asset"
        message={`Are you sure you want to retire ${selectedAsset?.asset_tag} (${selectedAsset?.name})? This marks the device as decommissioned.`}
        confirmText="Retire Asset"
        isDestructive
        isLoading={isSubmitting}
      />
    </div>
  );
};