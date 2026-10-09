import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Ticket as TicketIcon,
  Search,
  Plus,
  ArrowUpDown,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ticketService } from '../../services/ticketService';
import { Ticket } from '../../types/ticket';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Pagination } from '../../components/common/Pagination';
import { parseApiError } from '../../api/client';

export const TicketListPage: React.FC = () => {
  const { roleId, isTechnician } = useAuth();
  const [searchParams] = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'ALL');
  const [sortField, setSortField] = useState<'id' | 'created_at' | 'priority' | 'status'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: Ticket[] = [];
      
      if (!roleId || roleId === 1 || roleId === 2) {
        data = await ticketService.getAllTickets();
      } else if (isTechnician || roleId === 3) {
        data = await ticketService.getAssignedTickets();
      } else {
        try {
          data = await ticketService.getMyTickets();
          if (!data || data.length === 0) {
            data = await ticketService.getAllTickets();
          }
        } catch {
          data = await ticketService.getAllTickets();
        }
      }
      setTickets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      try {
        const fallbackData = await ticketService.getAllTickets();
        setTickets(Array.isArray(fallbackData) ? fallbackData : []);
      } catch {
        setError(parseApiError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [roleId]);

  // Filtering & Sorting
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = String(t.id).includes(q);
        const matchesTitle = (t.title || '').toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        const matchesRequester = (t.requester?.username || t.requester?.full_name || t.requester_name || '').toLowerCase().includes(q);
        const matchesAssignee = (t.assignee?.username || t.assignee?.full_name || t.assignee_name || '').toLowerCase().includes(q);

        if (!matchesId && !matchesTitle && !matchesDesc && !matchesRequester && !matchesAssignee) {
          return false;
        }
      }

      if (statusFilter !== 'ALL') {
        const s = (t.status || '').toLowerCase();
        if (s !== statusFilter.toLowerCase()) return false;
      }

      if (priorityFilter !== 'ALL') {
        const p = (t.priority || '').toLowerCase();
        if (p !== priorityFilter.toLowerCase()) return false;
      }

      if (categoryFilter !== 'ALL') {
        const c = (t.category || '').toLowerCase();
        if (c !== categoryFilter.toLowerCase()) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') {
        comparison = a.id - b.id;
      } else if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'priority') {
        const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        comparison = (priorityWeight[(a.priority || '').toLowerCase()] || 0) - (priorityWeight[(b.priority || '').toLowerCase()] || 0);
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter, sortField, sortDirection]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  const handleSort = (field: 'id' | 'created_at' | 'priority' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL';

  return (
    <div className="space-y-6 antialiased">
      {/* Header & Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <TicketIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>All Support Tickets</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Enterprise-wide ticket repository with assignment and SLA tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTickets}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Ticket</span>
          </Link>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchTickets} />}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-2xl dark:shadow-black/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, title, user..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900">All Statuses</option>
            <option value="Open" className="bg-white dark:bg-slate-900">Open</option>
            <option value="In Progress" className="bg-white dark:bg-slate-900">In Progress</option>
            <option value="Resolved" className="bg-white dark:bg-slate-900">Resolved</option>
            <option value="Closed" className="bg-white dark:bg-slate-900">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900">All Priorities</option>
            <option value="Low" className="bg-white dark:bg-slate-900">Low</option>
            <option value="Medium" className="bg-white dark:bg-slate-900">Medium</option>
            <option value="High" className="bg-white dark:bg-slate-900">High</option>
            <option value="Critical" className="bg-white dark:bg-slate-900">Critical</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900">All Categories</option>
            <option value="hardware" className="bg-white dark:bg-slate-900">Hardware</option>
            <option value="software" className="bg-white dark:bg-slate-900">Software</option>
            <option value="network" className="bg-white dark:bg-slate-900">Network</option>
            <option value="access" className="bg-white dark:bg-slate-900">Access</option>
            <option value="security" className="bg-white dark:bg-slate-900">Security</option>
            <option value="general" className="bg-white dark:bg-slate-900">General</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Found <strong className="text-slate-800 dark:text-slate-200">{filteredTickets.length}</strong> ticket(s)
            </span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 font-bold tracking-wider uppercase transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Tickets Table Container */}
      <div className="bg-white dark:bg-slate-900/60 dark:backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-2xl dark:shadow-black/80 overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : paginatedTickets.length === 0 ? (
          <EmptyState
            title="No tickets found"
            description="No tickets match your search parameters or filter options."
            actionLabel={hasActiveFilters ? 'Reset Filters' : 'Create Ticket'}
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th
                    onClick={() => handleSort('id')}
                    className="py-4 px-6 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>ID</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th className="py-4 px-6">Subject / Title</th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-4 px-6 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('priority')}
                    className="py-4 px-6 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Priority</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th className="py-4 px-6">Requester</th>
                  <th
                    onClick={() => handleSort('created_at')}
                    className="py-4 px-6 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Created</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedTickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      #{t.id}
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate font-semibold text-slate-900 dark:text-white">
                      {t.title}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-4 px-6">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                      {t.requester?.full_name || t.requester?.username || t.requester_name || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                      {formatDate(t.created_at)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/tickets/${t.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-white font-bold transition-all text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredTickets.length > pageSize && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredTickets.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};