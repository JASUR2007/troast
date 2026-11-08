// src/services/api.ts
import { profileService } from './profileService';
import { objectService } from './objectService';
import { taskService } from './taskService';
import { taskTransitionService } from './taskTransitionService';
import { STORAGE_OBJECTS, STORAGE_TASKS, STORAGE_HISTORY } from './storage';

export const api = {
  // Profiles
  getProfiles: profileService.getProfiles.bind(profileService),
  getProfileById: profileService.getProfileById.bind(profileService),

  // Objects
  getObjects: objectService.getObjects.bind(objectService),
  createObject: objectService.createObject.bind(objectService),

  // Tasks
  getTasks: taskService.getTasks.bind(taskService),
  getTaskById: taskService.getTaskById.bind(taskService),
  createTask: taskService.createTask.bind(taskService),
  deleteTask: taskService.deleteTask.bind(taskService),
  getTaskHistory: taskService.getTaskHistory.bind(taskService),

  // State Machine Transitions
  transitionTask: taskTransitionService.transitionTask.bind(taskTransitionService),

  // Storage reset
  resetDemoData() {
    localStorage.removeItem(STORAGE_OBJECTS);
    localStorage.removeItem(STORAGE_TASKS);
    localStorage.removeItem(STORAGE_HISTORY);
  },
};
