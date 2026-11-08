// src/lib/mockData/mockObjects.ts
import { BuildingObject } from '../../types';

export const INITIAL_OBJECTS: BuildingObject[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'ЖК «Северные Высоты»',
    address: 'г. Москва, ул. Полярная, д. 14',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Бизнес-центр «Аврора»',
    address: 'г. Санкт-Петербург, Лиговский пр-т, д. 48',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'СК «Южный Логистик»',
    address: 'г. Казань, ул. Промышленная, д. 5',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];
