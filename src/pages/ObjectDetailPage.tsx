// src/pages/ObjectDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BuildingObject, Task } from '../types';
import { TaskCard } from '../components/Tasks/TaskCard';
import { TaskStatusFilters } from '../components/Tasks/TaskStatusFilters';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { Building2, MapPin, Plus, ArrowLeft, Search, CheckSquare, AlertCircle } from 'lucide-react';

export const ObjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, profiles } = useAuth();

  const [currentObject, setCurrentObject] = useState<BuildingObject | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allObjects, setAllObjects] = useState<BuildingObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const loadData = async () => {
    if (!currentUser || !id) return;
    try {
      setIsLoading(true);
      const [userObjects, objectTasks] = await Promise.all([
        api.getObjects(currentUser),
        api.getTasks(currentUser, id),
      ]);
      setAllObjects(userObjects);
      setCurrentObject(userObjects.find((o) => o.id === id) || null);
      setTasks(objectTasks);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id, currentUser]);

  const isManager = currentUser?.role === 'manager';

  const filteredTasks = tasks.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.assignee?.display_name || '').toLowerCase().includes(q);
    return matchesSearch && (statusFilter === 'all' || t.status === statusFilter);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/objects" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к списку объектов</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" /></div>
      ) : !currentObject ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Объект не найден или доступ ограничен</h2>
          <p className="text-xs text-slate-500 mt-1">Исполнитель видит только объекты с назначенными ему задачами (RLS).</p>
          <button onClick={() => navigate('/objects')} className="mt-4 px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 transition">
            Вернуться ко всем объектам
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 mb-8 shadow-xs sm:flex sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600"><Building2 className="w-7 h-7" /></div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{currentObject.name}</h1>
                <div className="flex items-center space-x-1 text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>{currentObject.address}</span>
                </div>
              </div>
            </div>

            {isManager && (
              <button
                onClick={() => setIsCreateTaskOpen(true)}
                className="mt-4 sm:mt-0 inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Поставить задачу</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-sky-600" />
                <span>Задачи ({filteredTasks.length})</span>
              </h2>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск по задачам..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition w-full sm:w-48"
                  />
                </div>
                <TaskStatusFilters currentStatus={statusFilter} onChange={setStatusFilter} />
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
                <p className="text-sm font-semibold text-slate-700">Задач не найдено</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((t) => (
                  <TaskCard key={t.id} task={t} showObject={false} onClick={() => setSelectedTaskId(t.id)} />
                ))}
              </div>
            )}
          </div>

          <CreateTaskModal
            isOpen={isCreateTaskOpen}
            onClose={() => setIsCreateTaskOpen(false)}
            onSubmit={async (data) => {
              if (currentUser) {
                await api.createTask(currentUser, data);
                await loadData();
              }
            }}
            objects={allObjects}
            profiles={profiles}
            defaultObjectId={currentObject.id}
          />

          <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} onTaskUpdated={loadData} />
        </>
      )}
    </div>
  );
};
