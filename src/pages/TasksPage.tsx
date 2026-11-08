// src/pages/TasksPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { TaskCard } from '../components/Tasks/TaskCard';
import { TaskStatusFilters } from '../components/Tasks/TaskStatusFilters';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { CheckSquare, Search, Plus } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { currentUser, profiles } = useAuth();
  const { tasks, objects, isLoading, refresh, createTask } = useTasks();
  const [search, setSearch] = useState('');
  const [selectedObjectId, setSelectedObjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isManager = currentUser?.role === 'manager';

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.object?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.assignee?.display_name || '').toLowerCase().includes(search.toLowerCase());

    const matchesObject = selectedObjectId === 'all' || t.object_id === selectedObjectId;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesObject && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isManager ? 'Все задачи компании' : 'Мои назначенные задачи'}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {filteredTasks.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {isManager ? 'Контроль статусов и назначение исполнителей' : 'Задачи, назначенные лично вам (RLS изоляция)'}
          </p>
        </div>

        {isManager && (
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Создать задачу</span>
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по задачам или исполнителю..."
              className="block w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition"
            />
          </div>

          <div>
            <select
              value={selectedObjectId}
              onChange={(e) => setSelectedObjectId(e.target.value)}
              className="block w-full py-2 px-3 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition"
            >
              <option value="all">Все объекты строительства</option>
              {objects.map((obj) => (
                <option key={obj.id} value={obj.id}>{obj.name}</option>
              ))}
            </select>
          </div>
        </div>

        <TaskStatusFilters currentStatus={statusFilter} onChange={setStatusFilter} />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Задачи не найдены</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isManager ? 'Сбросьте фильтры или добавьте новую задачу.' : 'Вам не назначены задачи с выбранным статусом.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => setSelectedTaskId(task.id)} />
          ))}
        </div>
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createTask}
        objects={objects}
        profiles={profiles}
      />

      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={refresh}
      />
    </div>
  );
};
