// src/components/EditObjectModal.tsx
import React, { useState, useEffect } from 'react';
import { BuildingObject } from '../types';
import { X, Building2 } from 'lucide-react';

interface EditObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; address: string }) => Promise<void>;
  object: BuildingObject | null;
}

export const EditObjectModal: React.FC<EditObjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  object,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (object) {
      setName(object.name);
      setAddress(object.address);
    }
  }, [object]);

  if (!isOpen || !object) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim() || !address.trim()) {
      setError('Заполните название и адрес объекта');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit({ name: name.trim(), address: address.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ошибка редактирования объекта');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg">
            <Building2 className="w-5 h-5 text-sky-600" />
            <span>Редактировать объект</span>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Адрес <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
