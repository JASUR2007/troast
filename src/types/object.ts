// src/types/object.ts
import { TaskStatus } from './task';

export interface BuildingObject {
  id: string;
  name: string;
  address: string;
  created_at: string;
  tasks_count?: number;
  tasks_by_status?: Record<TaskStatus, number>;
}
