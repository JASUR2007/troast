// src/services/taskTransitionService.ts
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, Task, TaskHistoryItem, TaskStatus } from '../types';
import { INITIAL_TASKS, INITIAL_HISTORY } from '../lib/mockData';
import { STORAGE_TASKS, STORAGE_HISTORY, getStored, setStored } from './storage';

export const taskTransitionService = {
  async transitionTask(
    currentUser: Profile,
    params: {
      taskId: string;
      expectedStatus: TaskStatus;
      targetStatus: TaskStatus;
      comment?: string;
    }
  ): Promise<Task> {
    const { taskId, expectedStatus, targetStatus, comment = '' } = params;

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc('transition_task', {
        p_task_id: taskId,
        p_expected_status: expectedStatus,
        p_target_status: targetStatus,
        p_comment: comment,
      });

      if (error) {
        throw new Error(error.message || 'Ошибка смены статуса задачи');
      }

      const { data: updated, error: fetchErr } = await supabase
        .from('tasks')
        .select('*, object:objects(*), assignee:profiles!tasks_assignee_id_fkey(*), author:profiles!tasks_author_id_fkey(*)')
        .eq('id', taskId)
        .single();
      if (fetchErr || !updated) throw new Error('Не удалось получить обновленную задачу');
      return updated as Task;
    }

    // Демо-эмуляция проверок PostgreSQL transition_task
    const allTasks = getStored<Task[]>(STORAGE_TASKS, INITIAL_TASKS);
    const taskIndex = allTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) throw new Error('Задача не найдена');

    const currentTask = allTasks[taskIndex];
    if (currentTask.status !== expectedStatus) {
      throw new Error(`Конфликт состояния: ожидался ${expectedStatus}, актуальный ${currentTask.status}`);
    }

    // Валидация прав и переходов
    if (currentUser.role === 'executor') {
      if (currentTask.assignee_id !== currentUser.id) {
        throw new Error('Доступ запрещен: исполнитель может менять статус только своих задач');
      }
      const isAllowed =
        (expectedStatus === 'new' && targetStatus === 'in_progress') ||
        (expectedStatus === 'in_progress' && targetStatus === 'review') ||
        (expectedStatus === 'rework' && targetStatus === 'in_progress');
      if (!isAllowed) throw new Error(`Недопустимый переход: ${expectedStatus} -> ${targetStatus}`);
    } else if (currentUser.role === 'manager') {
      const isAllowed =
        (expectedStatus === 'review' && targetStatus === 'accepted') ||
        (expectedStatus === 'review' && targetStatus === 'rework');
      if (!isAllowed) throw new Error(`Недопустимый переход: ${expectedStatus} -> ${targetStatus}`);
      if (targetStatus === 'rework' && (!comment || comment.trim().length === 0)) {
        throw new Error('При возврате задачи на доработку комментарий обязателен');
      }
    }

    allTasks[taskIndex] = { ...currentTask, status: targetStatus };
    setStored(STORAGE_TASKS, allTasks);

    const allHistory = getStored<TaskHistoryItem[]>(STORAGE_HISTORY, INITIAL_HISTORY);
    const newHistoryEntry: TaskHistoryItem = {
      id: 'h-' + Date.now(),
      task_id: taskId,
      actor_id: currentUser.id,
      from_status: expectedStatus,
      to_status: targetStatus,
      comment: comment.trim(),
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_HISTORY, [newHistoryEntry, ...allHistory]);

    return allTasks[taskIndex];
  },
};
