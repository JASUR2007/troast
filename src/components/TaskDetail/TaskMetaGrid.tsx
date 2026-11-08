// src/components/TaskDetail/TaskMetaGrid.tsx
import React from 'react';
import { Task } from '../../types';
import { Building2, User, Calendar, Clock } from 'lucide-react';

export const TaskMetaGrid: React.FC<{ task: Task }> = ({ task }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
      <div className="flex items-center space-x-2">
        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
        <div>
          <div className="text-slate-500">Объект:</div>
          <div className="font-semibold text-slate-900">{task.object?.name || '—'}</div>
          <div className="text-[11px] text-slate-500 truncate">{task.object?.address}</div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <User className="w-4 h-4 text-slate-400 shrink-0" />
        <div>
          <div className="text-slate-500">Исполнитель:</div>
          <div className="font-semibold text-slate-900">{task.assignee?.display_name || 'Не назначен'}</div>
          <div className="text-[11px] text-slate-500">{task.assignee?.email}</div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
        <div>
          <div className="text-slate-500">Автор (Постановщик):</div>
          <div className="font-semibold text-slate-900">{task.author?.display_name || 'Постановщик'}</div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
        <div>
          <div className="text-slate-500">Дата создания:</div>
          <div className="font-semibold text-slate-900">
            {new Date(task.created_at).toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
