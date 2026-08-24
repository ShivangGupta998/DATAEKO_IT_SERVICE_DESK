import React from 'react';
import { Clock, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { Ticket } from '../../types/ticket';

export const SLAIndicator: React.FC<{ ticket: Ticket; className?: string }> = ({ ticket, className = '' }) => {
  // If ticket is resolved or closed, SLA is met or closed
  const isResolved = ['resolved', 'closed'].includes((ticket.status || '').toLowerCase());
  const slaStatus = ticket.sla?.status || ticket.sla_status || 'Within SLA';
  const remainingMinutes = ticket.sla?.remaining_minutes ?? ticket.remaining_minutes;
  const isBreached = ticket.sla?.is_breached || remainingMinutes !== undefined && remainingMinutes <= 0 || slaStatus.toLowerCase().includes('breach');
  const isAtRisk = !isBreached && (remainingMinutes !== undefined && remainingMinutes < 60 || slaStatus.toLowerCase().includes('risk'));

  const formatRemaining = (mins?: number) => {
    if (mins === undefined || isNaN(mins)) {
      return ticket.sla?.remaining_time || ticket.sla_due_date || 'Standard SLA';
    }
    if (mins <= 0) {
      const pastMins = Math.abs(mins);
      const hours = Math.floor(pastMins / 60);
      const remainM = pastMins % 60;
      return `${hours > 0 ? `${hours}h ` : ''}${remainM}m overdue`;
    }
    const hours = Math.floor(mins / 60);
    const remainM = mins % 60;
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours > 0 ? `${hours}h ` : ''}${remainM}m remaining`;
  };

  if (isResolved) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Resolved ({ticket.sla_status || 'SLA Met'})</span>
      </div>
    );
  }

  if (isBreached) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800 ${className}`}>
        <AlertOctagon className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
        <span>SLA Breached: {formatRemaining(remainingMinutes)}</span>
      </div>
    );
  }

  if (isAtRisk) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800 ${className}`}>
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span>SLA At Risk: {formatRemaining(remainingMinutes)}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800 ${className}`}>
      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      <span>SLA: {formatRemaining(remainingMinutes)}</span>
    </div>
  );
};
