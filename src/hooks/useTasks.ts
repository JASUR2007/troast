// src/hooks/useTasks.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Task, BuildingObject } from '../types';

export function useTasks(objectId?: string) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [objects, setObjects] = useState<BuildingObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const [loadedTasks, loadedObjects] = await Promise.all([
        api.getTasks(currentUser, objectId),
        api.getObjects(currentUser),
      ]);
      setTasks(loadedTasks);
      setObjects(loadedObjects);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, objectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createTask = async (data: {
    title: string;
    description: string;
    object_id: string;
    assignee_id: string;
  }) => {
    if (!currentUser) return;
    await api.createTask(currentUser, data);
    await loadData();
  };

  return { tasks, objects, isLoading, refresh: loadData, createTask };
}
