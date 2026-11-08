// src/components/Tasks/TaskCard.tsx
import React from 'react';
import { Task } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { Building2, User, Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  showObject?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, showObject = true }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 hover:border-sky-400 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="space-y-2 flex-1 pr-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <StatusBadge status={task.status} />
          <h3 className="text-base font-bold text-slate-900 hover:text-sky-600 transition-colors">
            {task.title}
          </h3>
        </div>

        {task.description && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
          {showObject && (
            <>
              <div className="flex items-center space-x-1.5 font-medium text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>{task.object?.name || 'Объект'}</span>
              </div>
              <span className="text-slate-300">•</span>
            </>
          )}

          <div className="flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800">
              {task.assignee?.display_name || 'Не назначен'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 shrink-0 text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Создана {new Date(task.created_at).toLocaleDateString('ru-RU')}</span>
        </div>
        <span className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-700">
          Подробнее и действия →
        </span>
      </div>
    </div>
  );
};
