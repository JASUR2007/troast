// src/components/EditTaskModal.tsx
import React, { useState, useEffect } from 'react';
import { Task, Profile } from '../types';
import { X, Edit3 } from 'lucide-react';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; assignee_id: string }) => Promise<void>;
  task: Task | null;
  profiles: Profile[];
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  task,
  profiles,
}) => {
  const executors = profiles.filter((p) => p.role === 'executor');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAssigneeId(task.assignee_id);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assigneeId) {
      setError('Заполните название и назначьте исполнителя');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        assignee_id: assigneeId,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ошибка обновления задачи');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg">
            <Edit3 className="w-5 h-5 text-sky-600" />
            <span>Редактировать задачу</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Название <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Исполнитель <span className="text-rose-500">*</span></label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
              required
            >
              {executors.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.display_name} ({ex.email})</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">При переназначении старый исполнитель теряет доступ через RLS.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Описание / ТЗ</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
            />
          </div>

          {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>}

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg">Отмена</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50">
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
