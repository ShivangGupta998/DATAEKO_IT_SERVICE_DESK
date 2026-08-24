import React from 'react';
import { Clock, User as UserIcon, MessageSquare, Tag, ArrowRight } from 'lucide-react';
import { TicketHistoryItem } from '../../types/ticket';

export const TicketTimeline: React.FC<{ history: TicketHistoryItem[]; className?: string }> = ({
  history,
  className = '',
}) => {
  if (!history || history.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
        No recorded history events for this ticket.
      </div>
    );
  }

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6 ${className}`}>
      {history.map((item, index) => {
        const actorName = item.user?.full_name || item.user?.username || item.changed_by_name || 'System';
        const isComment = !!item.comment || item.action === 'comment';

        return (
          <div key={item.id || index} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600 dark:bg-indigo-400 group-hover:scale-125 transition-transform" />

            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{actorName}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(item.created_at)}</span>
                </div>
              </div>

              {/* Action / Change Details */}
              {item.field_name && (
                <div className="mt-2 text-xs flex items-center gap-2 flex-wrap text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-slate-500 dark:text-slate-400 capitalize">
                    Updated {item.field_name.replace('_', ' ')}:
                  </span>
                  {item.old_value && (
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 line-through text-slate-500 dark:text-slate-400 text-[11px]">
                      {item.old_value}
                    </span>
                  )}
                  {item.old_value && <ArrowRight className="w-3 h-3 text-slate-400" />}
                  <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                    {item.new_value || '(empty)'}
                  </span>
                </div>
              )}

              {item.action && !item.field_name && (
                <div className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {item.action}
                </div>
              )}

              {/* Comment text */}
              {item.comment && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1 font-medium">
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span>Comment Note</span>
                  </div>
                  {item.comment}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
