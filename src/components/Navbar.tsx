// src/components/Navbar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Building2, CheckSquare, ShieldCheck, LogOut, ChevronDown, HardHat, RotateCcw, Database } from 'lucide-react';
import { INITIAL_PROFILES } from '../lib/mockData';

export const Navbar: React.FC<{ onOpenSecurityAudit: () => void }> = ({ onOpenSecurityAudit }) => {
  const { currentUser, signOut, switchQuickUser, isSupabaseConnected, toggleLiveDemoMode } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;
  const isManager = currentUser.role === 'manager';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-slate-900 font-bold text-xl tracking-tight">
              <div className="bg-sky-600 text-white p-2 rounded-lg flex items-center justify-center shadow-sm">
                <HardHat className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1.5">
                Troast <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">CRM</span>
              </span>
            </Link>

            <nav className="hidden md:flex space-x-1">
              <Link
                to="/objects"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/objects') ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Объекты</span>
              </Link>

              <Link
                to="/tasks"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/tasks' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>{isManager ? 'Все задачи' : 'Мои задачи'}</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenSecurityAudit}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition shadow-xs"
              title="Запустить проверку правил RLS и переходов"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Проверка RLS</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isSupabaseConnected ? 'Supabase Live' : 'Демо RLS'}</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-3 p-1.5 pl-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-left"
              >
                <div className="flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-900 leading-tight">{currentUser.display_name}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isManager ? 'text-amber-600' : 'text-sky-600'}`}>
                    {isManager ? '★ Постановщик' : '• Исполнитель'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs shadow-xs">
                  {currentUser.display_name.charAt(0)}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in" onClick={() => setIsOpen(false)}>
                  <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-500 font-medium">
                    Быстрое переключение ролей:
                  </div>
                  <div className="py-1">
                    {INITIAL_PROFILES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => switchQuickUser(p.email)}
                        className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition ${
                          p.id === currentUser.id ? 'bg-sky-50 text-sky-900 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{p.display_name}</div>
                          <div className="text-[11px] text-slate-400">{p.email}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                          p.role === 'manager' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {p.role === 'manager' ? 'Постановщик' : 'Исполнитель'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={toggleLiveDemoMode}
                      className="w-full text-left px-4 py-1.5 text-xs text-sky-700 hover:bg-sky-50 flex items-center space-x-2 font-medium"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>{isSupabaseConnected ? 'Перейти в Демо-режим' : 'Перейти в Live Supabase'}</span>
                    </button>
                    <button
                      onClick={() => { api.resetDemoData(); window.location.reload(); }}
                      className="w-full text-left px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Сбросить демо-данные</span>
                    </button>
                    <button onClick={() => signOut()} className="w-full text-left px-4 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2">
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Выйти из аккаунта</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
