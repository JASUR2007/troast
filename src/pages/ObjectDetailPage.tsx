// src/pages/ObjectDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSEO } from '../hooks/useSEO';
import { api } from '../services/api';
import { BuildingObject, Task } from '../types';
import { TaskCard } from '../components/Tasks/TaskCard';
import { TaskStatusFilters } from '../components/Tasks/TaskStatusFilters';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { EditObjectModal } from '../components/EditObjectModal';
import { Building2, MapPin, Plus, ArrowLeft, Search, CheckSquare, AlertCircle, Share2, Check, Edit, Trash2 } from 'lucide-react';

export const ObjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, profiles } = useAuth();
  const [currentObject, setCurrentObject] = useState<BuildingObject | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allObjects, setAllObjects] = useState<BuildingObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isEditObjectOpen, setIsEditObjectOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useSEO({
    title: currentObject ? currentObject.name : 'Карточка объекта',
    description: currentObject ? `Задачи и готовность объекта: ${currentObject.name}, ${currentObject.address}` : 'Объект строительства',
  });

  const loadData = async () => {
    if (!currentUser || !id) return;
    try {
      setIsLoading(true);
      setLoadError('');
      const [userObjects, objectTasks] = await Promise.all([api.getObjects(currentUser), api.getTasks(currentUser, id)]);
      setAllObjects(userObjects);
      const found = userObjects.find((o) => o.id === id) || null;
      setCurrentObject(found);
      setTasks(objectTasks);
    } catch (err: any) {
      setLoadError(err?.message || 'Не удалось загрузить данные объекта');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id, currentUser]);

  const isManager = currentUser?.role === 'manager';
  const acceptedCount = tasks.filter((t) => t.status === 'accepted').length;
  const progressPercent = tasks.length > 0 ? Math.round((acceptedCount / tasks.length) * 100) : 0;
  const statusCounts = {
    all: tasks.length, new: tasks.filter((t) => t.status === 'new').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    review: tasks.filter((t) => t.status === 'review').length,
    rework: tasks.filter((t) => t.status === 'rework').length, accepted: acceptedCount,
  };

  const filteredTasks = tasks.filter((t) => {
    const q = search.toLowerCase();
    const match = t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.assignee?.display_name || '').toLowerCase().includes(q);
    return match && (statusFilter === 'all' || t.status === statusFilter);
  });

  const handleDeleteObject = async () => {
    if (!currentObject || !currentUser || !confirm(`Удалить объект «${currentObject.name}» и все его задачи?`)) return;
    await api.deleteObject(currentUser, currentObject.id);
    navigate('/objects');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/objects" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft className="w-4 h-4" /><span>Объекты / {currentObject?.name || 'Карточка'}</span>
        </Link>
        <button onClick={() => { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}<span>{copied ? 'Скопировано!' : 'Поделиться'}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" /></div>
      ) : !currentObject ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">{loadError || 'Объект не найден или доступ ограничен'}</h2>
          <button onClick={() => navigate('/objects')} className="mt-4 px-4 py-2 bg-sky-600 text-white text-xs font-semibold rounded-lg">Вернуться</button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 mb-8 shadow-xs">
            <div className="sm:flex sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600"><Building2 className="w-7 h-7" /></div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{currentObject.name}</h1>
                  <div className="flex items-center space-x-1 text-xs text-slate-500 mt-0.5"><MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" /><span>{currentObject.address}</span></div>
                </div>
              </div>
              {isManager && (
                <div className="mt-4 sm:mt-0 flex items-center gap-2">
                  <button onClick={() => setIsEditObjectOpen(true)} className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5"><Edit className="w-3.5 h-3.5" /><span>Изменить</span></button>
                  <button onClick={handleDeleteObject} className="px-3 py-2 text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /><span>Удалить</span></button>
                  <button onClick={() => setIsCreateTaskOpen(true)} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"><Plus className="w-4 h-4" /><span>Поставить задачу</span></button>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Готовность объекта: <strong className="text-slate-900">{progressPercent}%</strong> ({acceptedCount} из {tasks.length} принято)</span>
              <div className="w-32 sm:w-48 bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} /></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><CheckSquare className="w-5 h-5 text-sky-600" /><span>Задачи объекта ({filteredTasks.length})</span></h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative"><Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по задачам..." className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-full sm:w-48" /></div>
                <TaskStatusFilters currentStatus={statusFilter} onChange={setStatusFilter} counts={statusCounts} />
              </div>
            </div>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6"><p className="text-sm font-semibold text-slate-700">Задач не найдено</p></div>
            ) : (
              <div className="space-y-3">{filteredTasks.map((t) => (<TaskCard key={t.id} task={t} showObject={false} onClick={() => setSelectedTaskId(t.id)} />))}</div>
            )}
          </div>

          <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} onSubmit={async (data) => { if (currentUser) { await api.createTask(currentUser, data); setIsCreateTaskOpen(false); await loadData(); } }} objects={allObjects} profiles={profiles} defaultObjectId={currentObject.id} />
          <EditObjectModal isOpen={isEditObjectOpen} onClose={() => setIsEditObjectOpen(false)} onSubmit={async (data) => { if (currentUser) { await api.updateObject(currentUser, currentObject.id, data); setIsEditObjectOpen(false); await loadData(); } }} object={currentObject} />
          <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} onTaskUpdated={loadData} />
        </>
      )}
    </div>
  );
};
