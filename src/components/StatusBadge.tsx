// src/components/StatusBadge.tsx
import React from 'react';
import { TaskStatus, STATUS_LABELS, STATUS_COLORS } from '../types';

export const StatusBadge: React.FC<{ status: TaskStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const meta = STATUS_COLORS[status] || STATUS_COLORS.new;
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.bg} ${meta.text} ${meta.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></span>
      <span>{label}</span>
    </span>
  );
};
