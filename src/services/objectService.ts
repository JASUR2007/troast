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

    if (currentUser.role === 'manager') return allObjects;

    const userObjIds = new Set(
      allTasks.filter((t) => t.assignee_id === currentUser.id).map((t) => t.object_id)
    );
    return allObjects.filter((obj) => userObjIds.has(obj.id));
  },

  async createObject(currentUser: Profile, data: { name: string; address: string }): Promise<BuildingObject> {
    if (currentUser.role !== 'manager') {
      throw new Error('Доступ запрещён: только постановщик может создавать объекты');
    }
    if (isSupabaseConfigured && supabase) {
      const { data: created, error } = await supabase
        .from('objects')
        .insert([{ name: data.name.trim(), address: data.address.trim() }])
        .select()
        .single();
      if (error) throw error;
      return created as BuildingObject;
    }

    const all = getStored<BuildingObject[]>(STORAGE_OBJECTS, INITIAL_OBJECTS);
    const newObj: BuildingObject = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'obj-' + Date.now(),
      name: data.name.trim(),
      address: data.address.trim(),
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_OBJECTS, [newObj, ...all]);
    return newObj;
  },

  async updateObject(currentUser: Profile, id: string, data: { name: string; address: string }): Promise<BuildingObject> {
    if (currentUser.role !== 'manager') {
      throw new Error('Доступ запрещён: только постановщик может редактировать объекты');
    }
    if (isSupabaseConfigured && supabase) {
      const { data: updated, error } = await supabase
        .from('objects')
        .update({ name: data.name.trim(), address: data.address.trim() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updated as BuildingObject;
    }

    const all = getStored<BuildingObject[]>(STORAGE_OBJECTS, INITIAL_OBJECTS);
    const idx = all.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Объект не найден');
    all[idx] = { ...all[idx], name: data.name.trim(), address: data.address.trim() };
    setStored(STORAGE_OBJECTS, all);
    return all[idx];
  },

  async deleteObject(currentUser: Profile, id: string): Promise<void> {
    if (currentUser.role !== 'manager') {
      throw new Error('Доступ запрещён: только постановщик может удалять объекты');
    }
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('objects').delete().eq('id', id);
      if (error) throw error;
      return;
    }

    const allObj = getStored<BuildingObject[]>(STORAGE_OBJECTS, INITIAL_OBJECTS);
    const allTasks = getStored<Task[]>(STORAGE_TASKS, INITIAL_TASKS);
    setStored(STORAGE_OBJECTS, allObj.filter((o) => o.id !== id));
    // Каскадное удаление задач объекта в демо
    setStored(STORAGE_TASKS, allTasks.filter((t) => t.object_id !== id));
  },
};
