// src/components/Tasks/TaskStatusFilters.tsx
import React from 'react';

const FILTER_TABS = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'review', label: 'На проверке' },
  { key: 'rework', label: 'На доработке' },
  { key: 'accepted', label: 'Приняты' },
];

interface TaskStatusFiltersProps {
  currentStatus: string;
  onChange: (status: string) => void;
  counts?: Record<string, number>;
}

export const TaskStatusFilters: React.FC<TaskStatusFiltersProps> = ({
  currentStatus,
  onChange,
  counts,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
      {FILTER_TABS.map((tab) => {
        const count = counts ? counts[tab.key] : undefined;
        const isActive = currentStatus === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              isActive
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            {count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
