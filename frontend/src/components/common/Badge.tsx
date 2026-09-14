import React from 'react';
import type { TicketPriority, TicketStatus } from '@/types/ticket';

interface BadgeProps {
  type: 'status' | 'priority' | 'role';
  value: TicketStatus | TicketPriority | 'Admin' | 'User' | string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'status') {
    switch (value) {
      case 'Open':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'InProgress':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'Resolved':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'Closed':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
        break;
    }
  } else if (type === 'priority') {
    switch (value) {
      case 'Low':
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
      case 'Medium':
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'High':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'Critical':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
        break;
    }
  } else if (type === 'role') {
    colorClasses =
      value === 'Admin'
        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
        : 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      {value}
    </span>
  );
};
