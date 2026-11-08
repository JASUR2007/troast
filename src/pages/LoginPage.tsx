// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { QuickLoginButtons } from './LoginPage/QuickLoginButtons';
import { LoginForm } from './LoginPage/LoginForm';
import { HardHat } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, switchQuickUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickLogin = async (email: string) => {
    setIsLoading(true);
    try {
      await switchQuickUser(email);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await signIn(email, pass);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-400/20 text-sky-400 mb-4 shadow-lg backdrop-blur-xs">
          <HardHat className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Troast CRM</h1>
        <p className="mt-2 text-sm text-slate-300">Мини-CRM строительной компании: «Объекты и задачи»</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-2xl border border-slate-100">
          <QuickLoginButtons onQuickLogin={handleQuickLogin} isLoading={isLoading} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">или ручной ввод</span>
            </div>
          </div>

          <LoginForm onSubmit={handleManualLogin} isLoading={isLoading} />

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 text-center leading-relaxed">
            Открытая регистрация отключена. Права доступа и видимость задач изолированы через RLS.
          </div>
        </div>
      </div>
    </div>
  );
};
