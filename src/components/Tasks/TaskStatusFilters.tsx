// src/components/Tasks/TaskStatusFilters.tsx
import React from 'react';

const FILTER_TABS = [
  { key: 'all', label: 'Все статусы' },
  { key: 'new', label: 'Новые' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'review', label: 'На проверке' },
  { key: 'rework', label: 'На доработке' },
  { key: 'accepted', label: 'Приняты' },
];

interface TaskStatusFiltersProps {
  currentStatus: string;
  onChange: (status: string) => void;
}

export const TaskStatusFilters: React.FC<TaskStatusFiltersProps> = ({
  currentStatus,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
      {FILTER_TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
            currentStatus === tab.key
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
