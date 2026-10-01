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
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
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
  const [category, setCategory] = useState('Hardware');
  const [manufacturer, setManufacturer] = useState('Apple');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [cost, setCost] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign form state
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // Access rights check
  const canManageAssets = isAdmin || isManager || isTechnician;

  const fetchAssets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = canManageAssets
        ? await assetService.getAllAssets()
        : await assetService.getMyAssets();

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
    if (!assetTag.trim() || !model.trim() || !serialNumber.trim()) return;

    setIsSubmitting(true);
    try {
      const computedName = manufacturer.trim()
        ? `${manufacturer.trim()} ${model.trim()}`
        : model.trim();

      await assetService.createAsset({
        asset_tag: assetTag.trim(),
        name: computedName,
        category,
        model: model.trim(),
        serial_number: serialNumber.trim(),
        cost: cost !== '' ? parseFloat(cost) : 0.0,
        purchase_date: purchaseDate || undefined,
      });

      success('Asset Created', `${assetTag} registered successfully.`);
      setShowCreateModal(false);

      // Reset form
      setAssetTag('');
      setCategory('Hardware');
      setManufacturer('Apple');
      setModel('');
      setSerialNumber('');
      setCost('');
      setPurchaseDate('');
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
      success('Asset Assigned', `${selectedAsset.asset_tag} assigned successfully.`);
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

  const renderAssignee = (asset: Asset) => {
    if (asset.assigned_to) {
      const name =
        typeof asset.assigned_to === 'object'
          ? asset.assigned_to.full_name || asset.assigned_to.username || `User #${asset.assigned_to.id}`
          : `User #${asset.assigned_to}`;
      return (
        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate">{name}</span>
        </div>
      );
    }

    if (asset.assigned_to_name) {
      return (
        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate">{asset.assigned_to_name}</span>
        </div>
      );
    }

    if (asset.assigned_to_id) {
      return (
        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>User #{asset.assigned_to_id}</span>
        </div>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 italic text-[11px] font-normal">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
        Unassigned
      </span>
    );
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTag = (a.asset_tag || '').toLowerCase().includes(q);
        const matchesName = (a.name || '').toLowerCase().includes(q);
        const matchesModel = (a.model || '').toLowerCase().includes(q);
        const matchesSerial = (a.serial_number || '').toLowerCase().includes(q);
        const matchesCategory = (a.category || '').toLowerCase().includes(q);
        if (!matchesTag && !matchesName && !matchesModel && !matchesSerial && !matchesCategory) {
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
    <div className="space-y-6 antialiased selection:bg-indigo-500 selection:text-white pb-10 transition-colors duration-300">
      {/* Top Banner / Header */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 rounded-2xl shadow-xs dark:shadow-2xl dark:shadow-black/80 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
            Hardware & Software Inventory
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Laptop className="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>IT Asset Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl font-medium">
            Track enterprise hardware, serial inventory, costs, assignments, and device lifecycles in real time.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAssets}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs active:scale-95 disabled:opacity-50"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
          </button>

          {canManageAssets && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Asset</span>
            </button>
          )}
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchAssets} />}

      {/* Filter & Control Bar */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-xs dark:shadow-2xl dark:shadow-black/80 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by tag, name, model, serial number, category..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold w-full sm:w-auto focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none cursor-pointer"
        >
          <option value="ALL" className="bg-white dark:bg-slate-900">All Asset Statuses</option>
          <option value="Available" className="bg-white dark:bg-slate-900">Available</option>
          <option value="Assigned" className="bg-white dark:bg-slate-900">Assigned</option>
          <option value="Under Maintenance" className="bg-white dark:bg-slate-900">Under Maintenance</option>
          <option value="Retired" className="bg-white dark:bg-slate-900">Retired</option>
        </select>
      </div>

      {/* Assets Table Container */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs dark:shadow-2xl dark:shadow-black/80 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={canManageAssets ? 8 : 7} />
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
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50/80 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800/80">
                  <tr>
                    <th className="py-3.5 px-4">Asset Tag</th>
                    <th className="py-3.5 px-4">Name / Model</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Serial Number</th>
                    <th className="py-3.5 px-4">Cost</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Assigned To</th>
                    {canManageAssets && <th className="py-3.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {asset.asset_tag}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{asset.name || 'N/A'}</div>
                        {asset.model && asset.model !== asset.name && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{asset.model}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 inline-block font-semibold">
                          {asset.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {asset.serial_number || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-200">
                        {asset.cost !== undefined && asset.cost !== null && !isNaN(Number(asset.cost))
                          ? `$${Number(asset.cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '$0.00'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={asset.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {renderAssignee(asset)}
                      </td>

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
                                className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
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
                                className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
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
        subtitle="Add a new hardware device or equipment to enterprise inventory"
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
                placeholder="e.g. LAP-002"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
              >
                <option value="Hardware" className="bg-white dark:bg-slate-900">Hardware</option>
                <option value="Laptop" className="bg-white dark:bg-slate-900">Laptop</option>
                <option value="Desktop" className="bg-white dark:bg-slate-900">Desktop</option>
                <option value="Software" className="bg-white dark:bg-slate-900">Software</option>
                <option value="Network" className="bg-white dark:bg-slate-900">Network</option>
                <option value="Peripheral" className="bg-white dark:bg-slate-900">Peripheral</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Apple / Dell / HP"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Model Name *
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. MacBook Pro 16"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Serial Number *
              </label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="SN123456"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cost ($)
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="1200.00"
                  className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
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
              placeholder="e.g. 4"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all outline-none"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Enter the recipient employee's numerical user ID.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="Optional assignment details or device condition notes..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
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