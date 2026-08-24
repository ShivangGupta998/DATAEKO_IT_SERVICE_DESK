import React from 'react';
import { TicketPriority, TicketStatus } from '../../types/ticket';
import { UserRole } from '../../types/auth';

interface BadgeProps {
  children?: React.ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<{ status: TicketStatus | string; className?: string }> = ({ status, className = '' }) => {
  const norm = (status || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (norm.includes('open') || norm.includes('new') || norm.includes('pending')) {
    styles = 'bg-slate-100 text-slate-700 border-slate-200';
    dotColor = 'bg-slate-400';
  } else if (norm.includes('in progress') || norm.includes('active') || norm.includes('assigned') || norm.includes('investigating')) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-500';
  } else if (norm.includes('resolved') || norm.includes('approved') || norm.includes('completed') || norm.includes('available')) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (norm.includes('closed') || norm.includes('retired') || norm.includes('rejected') || norm.includes('revoked')) {
    styles = 'bg-slate-100 text-slate-600 border-slate-200';
    dotColor = 'bg-slate-500';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold border whitespace-nowrap ${styles} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full mr-1.5 ${dotColor}`} />
      <span>{status || 'Open'}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TicketPriority | string; className?: string }> = ({ priority, className = '' }) => {
  const norm = (priority || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700';

  if (norm.includes('low')) {
    styles = 'bg-emerald-100 text-emerald-700';
  } else if (norm.includes('medium')) {
    styles = 'bg-amber-100 text-amber-700';
  } else if (norm.includes('high')) {
    styles = 'bg-orange-100 text-orange-700';
  } else if (norm.includes('critical') || norm.includes('urgent')) {
    styles = 'bg-rose-100 text-rose-700';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${styles} ${className}`}
    >
      {priority || 'MEDIUM'}
    </span>
  );
};

export const SLABadge: React.FC<{ status?: string; isBreached?: boolean; remainingMinutes?: number; className?: string }> = ({
  status,
  isBreached,
  remainingMinutes,
  className = '',
}) => {
  let label = status || 'Within SLA';
  let styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (isBreached || (remainingMinutes !== undefined && remainingMinutes <= 0) || (status && status.toLowerCase().includes('breach'))) {
    label = 'SLA BREACHED';
    styles = 'bg-rose-50 text-rose-700 border-rose-200 font-black';
  } else if ((remainingMinutes !== undefined && remainingMinutes < 60) || (status && status.toLowerCase().includes('risk'))) {
    label = 'SLA AT RISK';
    styles = 'bg-amber-50 text-amber-700 border-amber-200 font-black';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${styles} ${className}`}
    >
      {label}
    </span>
  );
};

export const RoleBadge: React.FC<{ roleId: number | UserRole; className?: string }> = ({ roleId, className = '' }) => {
  const id = Number(roleId);
  let name = 'USER';
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (id === UserRole.ADMIN) {
    name = 'ADMIN';
    styles = 'bg-purple-100 text-purple-700 border-purple-200';
  } else if (id === UserRole.MANAGER) {
    name = 'MANAGER';
    styles = 'bg-indigo-100 text-indigo-700 border-indigo-200';
  } else if (id === UserRole.TECHNICIAN) {
    name = 'TECHNICIAN';
    styles = 'bg-blue-100 text-blue-700 border-blue-200';
  } else if (id === UserRole.EMPLOYEE) {
    name = 'EMPLOYEE';
    styles = 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${styles} ${className}`}
    >
      {name}
    </span>
  );
};
