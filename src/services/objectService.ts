// src/services/objectService.ts
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BuildingObject, Profile, Task } from '../types';
import { INITIAL_OBJECTS, INITIAL_TASKS } from '../lib/mockData';
import { STORAGE_OBJECTS, STORAGE_TASKS, getStored, setStored } from './storage';

export const objectService = {
  async getObjects(currentUser: Profile): Promise<BuildingObject[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BuildingObject[];
    }

    const allObjects = getStored<BuildingObject[]>(STORAGE_OBJECTS, INITIAL_OBJECTS);
    const allTasks = getStored<Task[]>(STORAGE_TASKS, INITIAL_TASKS);

    if (currentUser.role === 'manager') {
      return allObjects;
    }

    // Исполнитель видит только объекты со своими задачами (RLS эмуляция)
    const userTaskObjectIds = new Set(
      allTasks.filter((t) => t.assignee_id === currentUser.id).map((t) => t.object_id)
    );
    return allObjects.filter((obj) => userTaskObjectIds.has(obj.id));
  },

  async createObject(currentUser: Profile, data: { name: string; address: string }): Promise<BuildingObject> {
    if (currentUser.role !== 'manager') {
      throw new Error('Доступ запрещён: только постановщик может создавать объекты');
    }

    if (isSupabaseConfigured && supabase) {
      const { data: created, error } = await supabase
        .from('objects')
        .insert([{ name: data.name, address: data.address }])
        .select()
        .single();
      if (error) throw error;
      return created as BuildingObject;
    }

    const allObjects = getStored<BuildingObject[]>(STORAGE_OBJECTS, INITIAL_OBJECTS);
    const newObj: BuildingObject = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'obj-' + Date.now(),
      name: data.name,
      address: data.address,
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_OBJECTS, [newObj, ...allObjects]);
    return newObj;
  },
};
