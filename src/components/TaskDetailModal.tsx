// src/components/TaskDetailModal.tsx
import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { ReworkCommentModal } from './ReworkCommentModal';
import { TaskMetaGrid } from './TaskDetail/TaskMetaGrid';
import { TaskActionButtons } from './TaskDetail/TaskActionButtons';
import { TaskHistoryTimeline } from './TaskDetail/TaskHistoryTimeline';
import { useTaskDetail } from '../hooks/useTaskDetail';
import { useAuth } from '../context/AuthContext';
import { X, AlertCircle } from 'lucide-react';

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  onClose,
  onTaskUpdated,
}) => {
  const { currentUser } = useAuth();
  const {
    task,
    history,
    isLoading,
    actionError,
    isProcessing,
    handleTransition,
    handleDelete,
  } = useTaskDetail(taskId, onTaskUpdated);

  const [isReworkModalOpen, setIsReworkModalOpen] = useState(false);

  if (!taskId) return null;

  const isAssigned = currentUser?.role === 'executor' && task?.assignee_id === currentUser.id;
  const isManager = currentUser?.role === 'manager';

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          
          <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
            <div className="space-y-1 pr-4">
              <div className="flex items-center gap-2">
                {task && <StatusBadge status={task.status} />}
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                  {task ? `№ ${task.code || task.id.slice(0, 6)}` : ''}
                </span>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  {task ? `UUID: ${task.id.slice(0, 8)}...` : ''}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {isLoading ? 'Загрузка...' : task?.title}
              </h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
              </div>
            ) : !task ? (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <p>Задача не найдена или доступ ограничен RLS</p>
              </div>
            ) : (
              <>
                {actionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                <TaskMetaGrid task={task} />

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Описание задачи</h4>
                  <div className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed shadow-2xs">
                    {task.description || <span className="text-slate-400 italic">Описание отсутствует</span>}
                  </div>
                </div>

                <TaskActionButtons
                  task={task}
                  isAssignedExecutor={isAssigned}
                  isManager={isManager}
                  isProcessing={isProcessing}
                  onTransition={(status) => handleTransition(status)}
                  onOpenReworkModal={() => setIsReworkModalOpen(true)}
                  onDelete={async () => {
                    await handleDelete();
                    onClose();
                  }}
                />

                <TaskHistoryTimeline history={history} />
              </>
            )}
          </div>

          <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition">
              Закрыть
            </button>
          </div>

        </div>
      </div>

      {task && (
        <ReworkCommentModal
          isOpen={isReworkModalOpen}
          onClose={() => setIsReworkModalOpen(false)}
          onSubmit={async (comment) => handleTransition('rework', comment)}
          taskTitle={task.title}
        />
      )}
    </>
  );
};
