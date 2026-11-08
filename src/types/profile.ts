// src/types/profile.ts
export type UserRole = 'manager' | 'executor';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at?: string;
}
