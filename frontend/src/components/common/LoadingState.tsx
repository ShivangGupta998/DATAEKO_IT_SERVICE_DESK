import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; label?: string; className?: string }> = ({
  size = 'md',
  label,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-slate-500 dark:text-slate-400 ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-indigo-600 dark:text-indigo-400`} />
      {label && <p className="mt-2 text-xs font-medium">{label}</p>}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="w-full animate-pulse divide-y divide-slate-100 dark:divide-slate-800">
      <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-t-lg mb-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="py-3.5 flex items-center justify-between gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className={`h-4 bg-slate-200 dark:bg-slate-800 rounded-md ${
                j === 0 ? 'w-1/6' : j === 1 ? 'w-1/3' : 'w-1/8'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
        >
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded-md w-2/3" />
        </div>
      ))}
    </div>
  );
};
