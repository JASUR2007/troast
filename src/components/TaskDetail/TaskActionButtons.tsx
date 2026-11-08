// src/components/TaskDetail/TaskActionButtons.tsx
import React from 'react';
import { Task, TaskStatus } from '../../types';
import { PlayCircle, Send, CheckCircle2, RotateCcw, Trash2, Edit } from 'lucide-react';

interface TaskActionButtonsProps {
  task: Task;
  isAssignedExecutor: boolean;
  isManager: boolean;
  isProcessing: boolean;
  onTransition: (status: TaskStatus) => void;
  onOpenReworkModal: () => void;
  onDelete: () => void;
  onEdit?: () => void;
}

export const TaskActionButtons: React.FC<TaskActionButtonsProps> = ({
  task,
  isAssignedExecutor,
  isManager,
  isProcessing,
  onTransition,
  onOpenReworkModal,
  onDelete,
  onEdit,
}) => {
  return (
    <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
        Доступные действия
      </h4>

      <div className="flex flex-wrap items-center gap-2">
        {isAssignedExecutor && task.status === 'new' && (
          <button
            onClick={() => onTransition('in_progress')}
            disabled={isProcessing}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Взять задачу в работу</span>
          </button>
        )}

        {isAssignedExecutor && task.status === 'in_progress' && (
          <button
            onClick={() => onTransition('review')}
            disabled={isProcessing}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Отправить на проверку</span>
          </button>
        )}

        {isAssignedExecutor && task.status === 'rework' && (
          <button
            onClick={() => onTransition('in_progress')}
            disabled={isProcessing}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Исправлено (В работу)</span>
          </button>
        )}

        {isManager && task.status === 'review' && (
          <>
            <button
              onClick={() => onTransition('accepted')}
              disabled={isProcessing}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Принять задачу</span>
            </button>
            <button
              onClick={onOpenReworkModal}
              disabled={isProcessing}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Вернуть на доработку</span>
            </button>
          </>
        )}

        {task.status === 'accepted' && (
          <div className="flex items-center space-x-2 text-xs font-medium text-emerald-700 bg-emerald-100/60 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Задача принята руководителем и закрыта.</span>
          </div>
        )}

        {isManager && (
          <div className="ml-auto flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                disabled={isProcessing}
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs text-sky-700 hover:text-sky-800 bg-white hover:bg-sky-50 rounded-lg border border-slate-200 transition"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Редактировать</span>
              </button>
            )}
            <button
              onClick={onDelete}
              disabled={isProcessing}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
              title="Удалить задачу"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
