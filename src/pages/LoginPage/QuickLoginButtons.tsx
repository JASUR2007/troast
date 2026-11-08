// src/pages/LoginPage/QuickLoginButtons.tsx
import React from 'react';
import { INITIAL_PROFILES } from '../../lib/mockData';
import { Sparkles } from 'lucide-react';

interface QuickLoginButtonsProps {
  onQuickLogin: (email: string) => void;
  isLoading: boolean;
}

export const QuickLoginButtons: React.FC<QuickLoginButtonsProps> = ({ onQuickLogin, isLoading }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Быстрый вход для проверки (1 клик):
        </span>
      </div>

      <div className="space-y-2">
        {INITIAL_PROFILES.map((p) => {
          const isMgr = p.role === 'manager';
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onQuickLogin(p.email)}
              disabled={isLoading}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                isMgr
                  ? 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/70 hover:border-amber-300'
                  : 'bg-sky-50/60 border-sky-200/80 hover:bg-sky-100/70 hover:border-sky-300'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-slate-900">{p.display_name}</div>
                <div className="text-[11px] text-slate-500">{p.email}</div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isMgr ? 'bg-amber-200/70 text-amber-900' : 'bg-sky-200/70 text-sky-900'
                }`}
              >
                {isMgr ? '★ Руководитель' : '• Исполнитель'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
