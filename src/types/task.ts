// src/types/task.ts
import { BuildingObject } from './object';
import { Profile } from './profile';

export type TaskStatus = 'new' | 'in_progress' | 'review' | 'accepted' | 'rework';

export interface Task {
  id: string;
  title: string;
  description: string;
  object_id: string;
  assignee_id: string;
  author_id: string;
  status: TaskStatus;
  created_at: string;
  object?: BuildingObject;
  assignee?: Profile;
  author?: Profile;
}

export interface TaskHistoryItem {
  id: string;
  task_id: string;
  actor_id: string;
  from_status: TaskStatus | null;
  to_status: TaskStatus;
  comment: string;
  created_at: string;
  actor?: Profile;
}
