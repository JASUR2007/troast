// src/services/taskHistoryService.ts
import { supabase, isLiveMode } from '../lib/supabase';
import { Profile, Task, TaskHistoryItem } from '../types';
import { INITIAL_PROFILES, INITIAL_TASKS, INITIAL_HISTORY } from '../lib/mockData';
import { STORAGE_TASKS, STORAGE_HISTORY, getStored } from './storage';

function dedupe(items: TaskHistoryItem[]): TaskHistoryItem[] {
  const seen = new Set<string>();
  return items.filter((h) => {
    const key = `${h.task_id}|${h.from_status}|${h.to_status}|${h.comment?.trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const taskHistoryService = {
  async getTaskHistory(currentUser: Profile, taskId: string): Promise<TaskHistoryItem[]> {
    if (isLiveMode()) {
      const { data, error } = await supabase!
        .from('task_history')
        .select('*, actor:profiles!task_history_actor_id_fkey(*)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return dedupe(data as TaskHistoryItem[]);
    }

    const allT = getStored<Task[]>(STORAGE_TASKS, INITIAL_TASKS);
    const task = allT.find((t) => t.id === taskId);
    if (!task) return [];
    if (currentUser.role === 'executor' && task.assignee_id !== currentUser.id) {
      throw new Error('Доступ запрещен: исполнитель видит историю только своих задач');
    }

    const allH = getStored<TaskHistoryItem[]>(STORAGE_HISTORY, INITIAL_HISTORY);
    const matched = allH
      .filter((h) => h.task_id === taskId)
      .map((h) => ({ ...h, actor: INITIAL_PROFILES.find((p) => p.id === h.actor_id) }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return dedupe(matched);
  },
};
