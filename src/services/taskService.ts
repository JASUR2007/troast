// src/services/taskService.ts
import { supabase, isLiveMode } from '../lib/supabase';
import { BuildingObject, Profile, Task, TaskHistoryItem } from '../types';
import { INITIAL_PROFILES, INITIAL_OBJECTS, INITIAL_TASKS, INITIAL_HISTORY } from '../lib/mockData';
import { STORAGE_OBJECTS, STORAGE_TASKS, STORAGE_HISTORY, getStored, setStored } from './storage';
import { taskHistoryService } from './taskHistoryService';

export const taskService = {
  async getTasks(currentUser: Profile, objectId?: string): Promise<Task[]> {
    if (isLiveMode()) {
      let q = supabase!.from('tasks').select('*, object:objects(*), assignee:profiles!tasks_assignee_id_fkey(*), author:profiles!tasks_author_id_fkey(*)').order('created_at', { ascending: false });
      if (objectId) q = q.eq('object_id', objectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Task[];
    }
    const allObj = getStored<BuildingObject[]>(STORAGE_OBJECTS, INITIAL_OBJECTS);
    const allT = getStored<Task[]>(STORAGE_TASKS, INITIAL_TASKS);
    let list = currentUser.role === 'executor' ? allT.filter((t) => t.assignee_id === currentUser.id) : allT;
    if (objectId) list = list.filter((t) => t.object_id === objectId);
    return list.map((t) => ({
      ...t,
      object: allObj.find((o) => o.id === t.object_id),
      assignee: INITIAL_PROFILES.find((p) => p.id === t.assignee_id),
      author: INITIAL_PROFILES.find((p) => p.id === t.author_id),
    }));
  },

  async getTaskById(currentUser: Profile, taskId: string): Promise<Task | null> {
    if (isLiveMode()) {
      const { data, error } = await supabase!.from('tasks').select('*, object:objects(*), assignee:profiles!tasks_assignee_id_fkey(*), author:profiles!tasks_author_id_fkey(*)').eq('id', taskId).maybeSingle();
      if (error) return null;
      return data as Task;
    }
    const list = await this.getTasks(currentUser);
    return list.find((t) => t.id === taskId) || null;
  },

  async createTask(currentUser: Profile, data: { title: string; description: string; object_id: string; assignee_id: string }): Promise<Task> {
    if (currentUser.role !== 'manager') throw new Error('Только постановщик может создавать задачи');
    if (isLiveMode()) {
      const { data: created, error } = await supabase!.from('tasks').insert([{
        title: data.title.trim(), description: data.description.trim(), object_id: data.object_id, assignee_id: data.assignee_id, author_id: currentUser.id, status: 'new',
      }]).select('*, object:objects(*), assignee:profiles!tasks_assignee_id_fkey(*), author:profiles!tasks_author_id_fkey(*)').single();
      if (error) throw error;
      return created as Task;
    }
    const allT = getStored<Task[]>(STORAGE_TASKS, INITIAL_TASKS);
    const allH = getStored<TaskHistoryItem[]>(STORAGE_HISTORY, INITIAL_HISTORY);
    const newId = crypto.randomUUID ? crypto.randomUUID() : 't-' + Date.now();
    const newTask: Task = {
      id: newId, code: String(100 + allT.length + 1), title: data.title.trim(), description: data.description.trim(),
      object_id: data.object_id, assignee_id: data.assignee_id, author_id: currentUser.id, status: 'new', created_at: new Date().toISOString(),
    };
    setStored(STORAGE_TASKS, [newTask, ...allT]);
    setStored(STORAGE_HISTORY, [{ id: 'h-' + Date.now(), task_id: newId, actor_id: currentUser.id, from_status: null, to_status: 'new', comment: 'Задача создана', created_at: new Date().toISOString() }, ...allH]);
    return (await this.getTaskById(currentUser, newId))!;
  },

  async updateTask(currentUser: Profile, taskId: string, data: { title: string; description: string; assignee_id: string }): Promise<Task> {
    if (currentUser.role !== 'manager') throw new Error('Только постановщик может редактировать задачи');
    if (isLiveMode()) {
      const { data: updated, error } = await supabase!.from('tasks').update({
        title: data.title.trim(), description: data.description.trim(), assignee_id: data.assignee_id,
      }).eq('id', taskId).select('*, object:objects(*), assignee:profiles!tasks_assignee_id_fkey(*), author:profiles!tasks_author_id_fkey(*)').single();
      if (error) throw error;
      return updated as Task;
    }
    const allT = getStored<Task[]>(STORAGE_TASKS, INITIAL_TASKS);
    const idx = allT.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error('Задача не найдена');
    const oldAssignee = allT[idx].assignee_id;
    allT[idx] = { ...allT[idx], title: data.title.trim(), description: data.description.trim(), assignee_id: data.assignee_id };
    setStored(STORAGE_TASKS, allT);
    if (oldAssignee !== data.assignee_id) {
      const allH = getStored<TaskHistoryItem[]>(STORAGE_HISTORY, INITIAL_HISTORY);
      const newExec = INITIAL_PROFILES.find((p) => p.id === data.assignee_id)?.display_name || 'новый исполнитель';
      setStored(STORAGE_HISTORY, [{ id: 'h-' + Date.now(), task_id: taskId, actor_id: currentUser.id, from_status: allT[idx].status, to_status: allT[idx].status, comment: `Переназначен исполнитель на: ${newExec}`, created_at: new Date().toISOString() }, ...allH]);
    }
    return (await this.getTaskById(currentUser, taskId))!;
  },

  async deleteTask(currentUser: Profile, taskId: string): Promise<void> {
    if (currentUser.role !== 'manager') throw new Error('Только постановщик может удалять задачи');
    if (isLiveMode()) {
      const { error } = await supabase!.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      return;
    }
    const allT = getStored<Task[]>(STORAGE_TASKS, INITIAL_TASKS);
    setStored(STORAGE_TASKS, allT.filter((t) => t.id !== taskId));
  },

  getTaskHistory: taskHistoryService.getTaskHistory.bind(taskHistoryService),
};
