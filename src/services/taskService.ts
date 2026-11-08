// src/services/taskService.ts
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BuildingObject, Profile, Task, TaskHistoryItem } from '../types';
import { INITIAL_PROFILES, INITIAL_OBJECTS, INITIAL_TASKS, INITIAL_HISTORY } from '../lib/mockData';
import { STORAGE_OBJECTS, STORAGE_TASKS, STORAGE_HISTORY, getStored, setStored } from './storage';

export const taskService = {
  async getTasks(currentUser: Profile, objectId?: string): Promise<Task[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('tasks')
        .select('*, object:objects(*), assignee:profiles!tasks_assignee_id_fkey(*), author:profiles!tasks_author_id_fkey(*)')
        .order('created_at', { ascending: false });

      if (objectId) query = query.eq('object_id', objectId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    }

    const allObjects = getStored<BuildingObject[]>(STORAGE_OBJECTS, INITIAL_OBJECTS);
    const allTasks = getStored<Task[]>(STORAGE_TASKS, INITIAL_TASKS);
    let filtered = currentUser.role === 'executor'
      ? allTasks.filter((t) => t.assignee_id === currentUser.id)
      : allTasks;

    if (objectId) filtered = filtered.filter((t) => t.object_id === objectId);

    return filtered.map((task) => ({
      ...task,
      object: allObjects.find((o) => o.id === task.object_id),
      assignee: INITIAL_PROFILES.find((p) => p.id === task.assignee_id),
      author: INITIAL_PROFILES.find((p) => p.id === task.author_id),
    }));
  },

  async getTaskById(currentUser: Profile, taskId: string): Promise<Task | null> {
    const list = await this.getTasks(currentUser);
    return list.find((t) => t.id === taskId) || null;
  },

  async createTask(
    currentUser: Profile,
    data: { title: string; description: string; object_id: string; assignee_id: string }
  ): Promise<Task> {
    if (currentUser.role !== 'manager') {
      throw new Error('Доступ запрещён: только постановщик может создавать задачи');
    }

    if (isSupabaseConfigured && supabase) {
      const { data: created, error } = await supabase
        .from('tasks')
        .insert([{
          title: data.title,
          description: data.description,
          object_id: data.object_id,
          assignee_id: data.assignee_id,
          author_id: currentUser.id,
          status: 'new',
        }])
        .select('*, object:objects(*), assignee:profiles!tasks_assignee_id_fkey(*), author:profiles!tasks_author_id_fkey(*)')
        .single();
      if (error) throw error;
      return created as Task;
    }

    const allTasks = getStored<Task[]>(STORAGE_TASKS, INITIAL_TASKS);
    const allHistory = getStored<TaskHistoryItem[]>(STORAGE_HISTORY, INITIAL_HISTORY);
    const newId = crypto.randomUUID ? crypto.randomUUID() : 't-' + Date.now();

    const newTask: Task = {
      id: newId,
      title: data.title,
      description: data.description,
      object_id: data.object_id,
      assignee_id: data.assignee_id,
      author_id: currentUser.id,
      status: 'new',
      created_at: new Date().toISOString(),
    };

    setStored(STORAGE_TASKS, [newTask, ...allTasks]);
    setStored(STORAGE_HISTORY, [{
      id: 'h-' + Date.now(),
      task_id: newId,
      actor_id: currentUser.id,
      from_status: null,
      to_status: 'new',
      comment: 'Задача создана',
      created_at: new Date().toISOString(),
    }, ...allHistory]);

    return (await this.getTaskById(currentUser, newId))!;
  },

  async deleteTask(currentUser: Profile, taskId: string): Promise<void> {
    if (currentUser.role !== 'manager') {
      throw new Error('Доступ запрещён: только постановщик может удалять задачи');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      return;
    }

    const allTasks = getStored<Task[]>(STORAGE_TASKS, INITIAL_TASKS);
    setStored(STORAGE_TASKS, allTasks.filter((t) => t.id !== taskId));
  },

  async getTaskHistory(currentUser: Profile, taskId: string): Promise<TaskHistoryItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('task_history')
        .select('*, actor:profiles!task_history_actor_id_fkey(*)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TaskHistoryItem[];
    }

    const allTasks = getStored<Task[]>(STORAGE_TASKS, INITIAL_TASKS);
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return [];
    if (currentUser.role === 'executor' && task.assignee_id !== currentUser.id) {
      throw new Error('Доступ запрещен: исполнитель может просматривать историю только своих задач');
    }

    const allHistory = getStored<TaskHistoryItem[]>(STORAGE_HISTORY, INITIAL_HISTORY);
    return allHistory
      .filter((h) => h.task_id === taskId)
      .map((h) => ({ ...h, actor: INITIAL_PROFILES.find((p) => p.id === h.actor_id) }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
};
