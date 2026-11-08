// src/lib/mockData/mockProfiles.ts
import { Profile } from '../../types';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    email: 'manager@troast.ru',
    display_name: 'Алексей Смирнов (Руководитель)',
    role: 'manager',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    email: 'alex@troast.ru',
    display_name: 'Александр Воронов (Электрик)',
    role: 'executor',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    email: 'dmitry@troast.ru',
    display_name: 'Дмитрий Кузнецов (Прораб)',
    role: 'executor',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];
