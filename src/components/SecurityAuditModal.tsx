// src/components/SecurityAuditModal.tsx
import React from 'react';
import { useSecurityAudit } from '../hooks/useSecurityAudit';
import { AuditResultItem } from './SecurityAudit/AuditResultItem';
import { ShieldCheck, Play, X, Lock } from 'lucide-react';

export const SecurityAuditModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { isRunning, results, runAudit } = useSecurityAudit();

  if (!isOpen) return null;

  const passedCount = results.filter((r) => r.passed).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>Интерактивный аудит безопасности и RLS</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-3">
            <Lock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 mb-1">Проверка Раздела 3 ТЗ («Безопасность»):</p>
              <p>Прямые запросы проверяют изоляцию RLS, запрещённые переходы и защиту истории от подделки.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={runAudit}
              disabled={isRunning}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isRunning ? 'Выполнение проверок...' : 'Запустить полный тест RLS'}</span>
            </button>

            {results.length > 0 && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Пройдено: {passedCount} / {results.length}
              </span>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {results.map((res) => (
              <AuditResultItem key={res.id} res={res} />
            ))}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition">
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
