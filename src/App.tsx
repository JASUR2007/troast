// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { ObjectsPage } from './pages/ObjectsPage';
import { ObjectDetailPage } from './pages/ObjectDetailPage';
import { TasksPage } from './pages/TasksPage';
import { SecurityAuditModal } from './components/SecurityAuditModal';

const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const [isSecurityAuditOpen, setIsSecurityAuditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onOpenSecurityAudit={() => setIsSecurityAuditOpen(true)} />

      <main className="flex-1 pb-16">
        <Routes>
          <Route path="/" element={<Navigate to="/objects" replace />} />
          <Route path="/objects" element={<ObjectsPage />} />
          <Route path="/objects/:id" element={<ObjectDetailPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="*" element={<Navigate to="/objects" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Troast CRM — Тестовое задание 2B Studio (React + TypeScript + Supabase RLS)
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSecurityAuditOpen(true)}
              className="text-emerald-700 hover:underline font-semibold"
            >
              Запустить аудит RLS
            </button>
            <span>•</span>
            <span className="font-mono text-slate-400">PostgreSQL State Machine</span>
          </div>
        </div>
      </footer>

      {/* Security Audit Modal */}
      <SecurityAuditModal
        isOpen={isSecurityAuditOpen}
        onClose={() => setIsSecurityAuditOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
