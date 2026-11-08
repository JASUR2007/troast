// src/hooks/useObjects.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BuildingObject, Task } from '../types';

export function useObjects() {
  const { currentUser } = useAuth();
  const [objects, setObjects] = useState<BuildingObject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const [loadedObjects, loadedTasks] = await Promise.all([
        api.getObjects(currentUser),
        api.getTasks(currentUser),
      ]);
      setObjects(loadedObjects);
      setTasks(loadedTasks);
    } catch (err) {
      console.error('Failed to load objects', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createObject = async (data: { name: string; address: string }) => {
    if (!currentUser) return;
    await api.createObject(currentUser, data);
    await loadData();
  };

  return { objects, tasks, isLoading, refresh: loadData, createObject };
}
