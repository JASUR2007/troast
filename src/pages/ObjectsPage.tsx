// src/pages/ObjectsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useObjects } from '../hooks/useObjects';
import { ObjectCard } from '../components/Objects/ObjectCard';
import { CreateObjectModal } from '../components/CreateObjectModal';
import { Building2, Plus, Search } from 'lucide-react';

export const ObjectsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { objects, tasks, isLoading, createObject } = useObjects();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filtered = objects.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.address.toLowerCase().includes(search.toLowerCase())
  );

  const isManager = currentUser?.role === 'manager';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Объекты строительства</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {filtered.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {isManager ? 'Полный список строек компании и контроль задач' : 'Стройки с назначенными вам задачами (RLS)'}
          </p>
        </div>

        {isManager && (
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить объект</span>
            </button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или адресу стройки..."
            className="block w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Объекты не найдены</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {!isManager ? 'Вам пока не назначены задачи ни на одном объекте.' : 'Создайте первый объект, чтобы начать ставить задачи.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((obj) => (
            <ObjectCard key={obj.id} obj={obj} tasks={tasks} onClick={() => navigate(`/objects/${obj.id}`)} />
          ))}
        </div>
      )}

      <CreateObjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createObject}
      />
    </div>
  );
};
