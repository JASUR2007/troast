// src/components/MobileNav.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, CheckSquare, ShieldCheck, User, LogOut, RotateCcw, X } from 'lucide-react';
import { INITIAL_PROFILES } from '../lib/mockData';
import { api } from '../services/api';

interface MobileNavProps {
  onOpenSecurityAudit: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenSecurityAudit }) => {
  const { currentUser, switchQuickUser, signOut } = useAuth();
  const location = useLocation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  if (!currentUser) return null;
  const isManager = currentUser.role === 'manager';

  const isObjectsActive = location.pathname === '/' || location.pathname.startsWith('/objects');
  const isTasksActive = location.pathname.startsWith('/tasks');

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <Link
          to="/objects"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
            isObjectsActive ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Объекты</span>
        </Link>

        <Link
          to="/tasks"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
            isTasksActive ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{isManager ? 'Все задачи' : 'Мои задачи'}</span>
        </Link>

        <button
          onClick={onOpenSecurityAudit}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px] mt-0.5">Аудит RLS</span>
        </button>

        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
        >
          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">
            {currentUser.display_name.charAt(0)}
          </div>
          <span className="text-[10px] mt-0.5 max-w-[60px] truncate">
            {isManager ? 'Руководитель' : 'Исполнитель'}
          </span>
        </button>
      </nav>

      {isProfileModalOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center p-0">
          <div className="bg-white rounded-t-2xl w-full p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-sky-600" />
                <div>
                  <div className="text-sm font-bold text-slate-900">{currentUser.display_name}</div>
                  <div className="text-xs text-slate-500">{currentUser.email}</div>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                Быстрое переключение ролей:
              </div>
              <div className="space-y-1.5">
                {INITIAL_PROFILES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchQuickUser(p.email);
                      setIsProfileModalOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                      p.id === currentUser.id
                        ? 'bg-sky-50 border-sky-200 text-sky-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{p.display_name}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      {p.role === 'manager' ? 'Руководитель' : 'Исполнитель'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => { api.resetDemoData(); window.location.reload(); }}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Сброс</span>
              </button>
              <button
                onClick={() => { signOut(); setIsProfileModalOpen(false); }}
                className="flex-1 py-2 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Выход</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
