// src/components/ReworkCommentModal.tsx
import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ReworkCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => Promise<void>;
  taskTitle: string;
}

export const ReworkCommentModal: React.FC<ReworkCommentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  taskTitle,
}) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) {
      setError('Комментарий обязателен при возврате задачи на доработку');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit(trimmed);
      setComment('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ошибка отправки на доработку');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-rose-600 font-bold text-lg">
            <AlertCircle className="w-5 h-5" />
            <span>Возврат на доработку</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Задача:</p>
            <p className="text-sm font-semibold text-slate-800">{taskTitle}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Замечания и требования к исправлению <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError('');
              }}
              placeholder="Укажите конкретные дефекты или несоответствия требованиям..."
              className="w-full text-sm rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              По условию ТЗ возврат на доработку невозможен без комментария (проверяется базой данных).
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg hover:bg-slate-100 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? 'Сохранение...' : 'Вернуть на доработку'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
