// src/hooks/useTaskDetail.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Task, TaskHistoryItem, TaskStatus } from '../types';

export function useTaskDetail(taskId: string | null, onUpdated?: () => void) {
  const { currentUser } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    if (!taskId || !currentUser) return;
    try {
      setIsLoading(true);
      setActionError('');
      const loadedTask = await api.getTaskById(currentUser, taskId);
      setTask(loadedTask);
      if (loadedTask) {
        const historyData = await api.getTaskHistory(currentUser, taskId);
        setHistory(historyData);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Не удалось загрузить данные задачи');
    } finally {
      setIsLoading(false);
    }
  }, [taskId, currentUser]);

  useEffect(() => {
    if (taskId) {
      loadData();
    } else {
      setTask(null);
      setHistory([]);
    }
  }, [taskId, loadData]);

  const handleTransition = async (targetStatus: TaskStatus, comment = '') => {
    if (!task || !currentUser) return;
    try {
      setIsProcessing(true);
      setActionError('');
      await api.transitionTask(currentUser, {
        taskId: task.id,
        expectedStatus: task.status,
        targetStatus,
        comment,
      });
      await loadData();
      onUpdated?.();
    } catch (err: any) {
      setActionError(err?.message || 'Ошибка изменения статуса');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !currentUser) return;
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;
    try {
      setIsProcessing(true);
      await api.deleteTask(currentUser, task.id);
      onUpdated?.();
    } catch (err: any) {
      setActionError(err?.message || 'Ошибка удаления задачи');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    task,
    history,
    isLoading,
    actionError,
    isProcessing,
    handleTransition,
    handleDelete,
  };
}
