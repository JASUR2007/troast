// src/lib/mockData/mockObjects.ts
import { BuildingObject } from '../../types';

export const INITIAL_OBJECTS: BuildingObject[] = [
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    name: 'ЖК «Северные Высоты»',
    address: 'г. Москва, ул. Полярная, д. 14',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    name: 'Бизнес-центр «Аврора»',
    address: 'г. Санкт-Петербург, Лиговский пр-т, д. 48',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: '8d2f5a34-2e11-4b6c-9c71-3f4a8b9c0d12',
    name: 'СК «Южный Логистик»',
    address: 'г. Казань, ул. Промышленная, д. 5',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];
