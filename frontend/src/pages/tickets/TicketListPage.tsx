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
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../services/ticketService';
import { Ticket } from '../../types/ticket';
import { StatusBadge, PriorityBadge, SLABadge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Pagination } from '../../components/common/Pagination';
import { parseApiError } from '../../api/client';

export const TicketListPage: React.FC = () => {
  const { roleId, isTechnician, isEmployee } = useAuth();
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
      
      // Fallback logic: If roleId is missing, 1, or 2 -> fetch all tickets
      if (!roleId || roleId === 1 || roleId === 2) {
        data = await ticketService.getAllTickets();
      } else if (isTechnician || roleId === 3) {
        data = await ticketService.getAssignedTickets();
      } else {
        // If employee endpoint fails or returns empty, try getAllTickets as fallback
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
      // Primary API endpoint fallback
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
      // Search
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

      // Status
      if (statusFilter !== 'ALL') {
        const s = (t.status || '').toLowerCase();
        if (s !== statusFilter.toLowerCase()) return false;
      }

      // Priority
      if (priorityFilter !== 'ALL') {
        const p = (t.priority || '').toLowerCase();
        if (p !== priorityFilter.toLowerCase()) return false;
      }

      // Category
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

  // Paginated subset
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
    <div className="space-y-6">
      {/* Header & Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <TicketIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>All Support Tickets</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise-wide ticket repository with assignment and SLA tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTickets}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Ticket</span>
          </Link>
        </div>
      </div>

      {error && <ErrorAlert error={error} onRetry={fetchTickets} />}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by ID, title, description, requester, or assignee..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Selects */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Network">Network</option>
              <option value="Access">Access</option>
              <option value="Security">Security</option>
              <option value="General">General</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-2.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-medium transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ticket List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} columns={7} />
          </div>
        ) : filteredTickets.length === 0 ? (
          <EmptyState
            title="No tickets found"
            description={
              hasActiveFilters
                ? 'No tickets match your active search and filter criteria.'
                : 'There are currently no tickets in this view.'
            }
            actionLabel="Create First Ticket"
            onAction={() => {
              window.location.href = '/tickets/new';
            }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                      onClick={() => handleSort('id')}
                    >
                      <div className="flex items-center gap-1">
                        <span>ID</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Title & Category</th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                      onClick={() => handleSort('priority')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Priority</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">SLA Status</th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Created</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {paginatedTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        #{ticket.id}
                      </td>

                      <td className="py-3.5 px-4 max-w-[260px]">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1"
                        >
                          {ticket.title}
                        </Link>
                        {ticket.category && (
                          <span className="text-[10px] text-slate-400 mt-0.5 inline-block">
                            Category: {ticket.category}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={ticket.priority} />
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={ticket.status} />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {ticket.requester?.full_name || ticket.requester?.username || ticket.requester_name || 'Requester'}
                        </div>
                        {ticket.requester?.email && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {ticket.requester.email}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {ticket.assignee ? (
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {ticket.assignee.full_name || ticket.assignee.username || ticket.assignee_name}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <SLABadge
                          status={ticket.sla?.status || ticket.sla_status}
                          remainingMinutes={ticket.sla?.remaining_minutes ?? ticket.remaining_minutes}
                          isBreached={ticket.sla?.is_breached}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(ticket.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors"
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

            <Pagination
              currentPage={currentPage}
              totalItems={filteredTickets.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};