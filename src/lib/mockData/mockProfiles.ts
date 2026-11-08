// src/lib/mockData/mockProfiles.ts
import { Profile } from '../../types';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'manager@troast.ru',
    display_name: 'Алексей Смирнов (Руководитель)',
    role: 'manager',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'alex@troast.ru',
    display_name: 'Александр Воронов (Электрик)',
    role: 'executor',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'dmitry@troast.ru',
    display_name: 'Дмитрий Кузнецов (Прораб)',
    role: 'executor',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];
