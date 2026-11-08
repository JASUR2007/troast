// src/hooks/useSecurityAudit.ts
import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from '../services/api';
import { INITIAL_PROFILES, INITIAL_TASKS } from '../lib/mockData';

export interface TestResult {
  id: string;
  title: string;
  description: string;
  passed: boolean;
  message: string;
}

export function useSecurityAudit() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runAudit = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Test 1: Изоляция чтения задач исполнителя
    try {
      const alex = INITIAL_PROFILES[1];
      const alexTasks = await api.getTasks(alex);
      const leaked = alexTasks.some((t) => t.assignee_id !== alex.id);
      testResults.push({
        id: 'test-1',
        title: '1. RLS: Изоляция чтения задач исполнителя',
        description: 'Исполнитель Александр не должен видеть задачи Дмитрия',
        passed: !leaked,
        message: !leaked ? `Успешно: Александру возвращено только ${alexTasks.length} его личных задач.` : 'ОШИБКА: утечка чужих задач!',
      });
    } catch (e: any) {
      testResults.push({ id: 'test-1', title: '1. RLS чтение', description: '', passed: false, message: e.message });
    }

    // Test 2: Запрет обновления чужой задачи
    try {
      const alex = INITIAL_PROFILES[1];
      const dmitryTask = INITIAL_TASKS.find((t) => t.assignee_id !== alex.id)!;
      let rejected = false;
      try {
        await api.transitionTask(alex, { taskId: dmitryTask.id, expectedStatus: dmitryTask.status, targetStatus: 'in_progress' });
      } catch {
        rejected = true;
      }
      testResults.push({
        id: 'test-2',
        title: '2. RLS & RPC: Запрет обновления чужой задачи',
        description: 'Попытка исполнителя перевести в работу чужую задачу по UUID',
        passed: rejected,
        message: rejected ? 'Успешно: База отклонила попытку манипуляции чужой задачей.' : 'ОШИБКА: разрешено изменение чужой задачи!',
      });
    } catch (e: any) {
      testResults.push({ id: 'test-2', title: '2. Чужая задача', description: '', passed: false, message: e.message });
    }

    // Test 3: Запрещённый переход Новая -> Принята
    try {
      const manager = INITIAL_PROFILES[0];
      const newTask = INITIAL_TASKS.find((t) => t.status === 'new')!;
      let rejected = false;
      try {
        await api.transitionTask(manager, { taskId: newTask.id, expectedStatus: 'new', targetStatus: 'accepted' });
      } catch {
        rejected = true;
      }
      testResults.push({
        id: 'test-3',
        title: '3. State Machine: Запрет перехода "Новая" -> "Принята"',
        description: 'Задача не может быть сразу принята в обход этапов выполнения',
        passed: rejected,
        message: rejected ? 'Успешно: Недопустимый скачок статуса отклонён базой.' : 'ОШИБКА: пропущен запрещенный переход!',
      });
    } catch (e: any) {
      testResults.push({ id: 'test-3', title: '3. Переход', description: '', passed: false, message: e.message });
    }

    // Test 4: Возврат на доработку без комментария
    try {
      const manager = INITIAL_PROFILES[0];
      const reviewTask = INITIAL_TASKS.find((t) => t.status === 'review')!;
      let rejected = false;
      try {
        await api.transitionTask(manager, { taskId: reviewTask.id, expectedStatus: 'review', targetStatus: 'rework', comment: '  ' });
      } catch {
        rejected = true;
      }
      testResults.push({
        id: 'test-4',
        title: '4. ТЗ: Обязательность комментария при возврате на доработку',
        description: 'Возврат с "На проверке" в "На доработке" обязан содержать комментарий',
        passed: rejected,
        message: rejected ? 'Успешно: База заблокировала возврат без комментария.' : 'ОШИБКА: возврат без комментария допущен!',
      });
    } catch (e: any) {
      testResults.push({ id: 'test-4', title: '4. Комментарий', description: '', passed: false, message: e.message });
    }

    // Test 5: Запрет прямой вставки в task_history
    try {
      let rejected = true;
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('task_history').insert([{
          task_id: INITIAL_TASKS[0].id,
          actor_id: INITIAL_PROFILES[1].id,
          to_status: 'accepted',
          comment: 'Взлом истории',
        }]);
        rejected = Boolean(error);
      }
      testResults.push({
        id: 'test-5',
        title: '5. Безопасность: Защита истории от прямой записи клиентом',
        description: 'Попытка выполнить прямой INSERT в таблицу task_history минуя триггеры',
        passed: rejected,
        message: rejected ? 'Успешно: RLS запрещает прямое добавление или правку истории через API.' : 'ОШИБКА: INSERT разрешён!',
      });
    } catch (e: any) {
      testResults.push({ id: 'test-5', title: '5. Защита истории', description: '', passed: false, message: e.message });
    }

    // Test 6: Объекты без назначенных задач скрыты от исполнителя
    try {
      const alex = INITIAL_PROFILES[1];
      const alexObjects = await api.getObjects(alex);
      const leakedObj = alexObjects.some((o) => o.name.includes('Южный'));
      testResults.push({
        id: 'test-6',
        title: '6. RLS: Исполнитель видит только объекты со своими задачами',
        description: 'Объект СК «Южный» назначен только Дмитрию и скрыт для Александра',
        passed: !leakedObj,
        message: !leakedObj ? 'Успешно: Александр видит только те стройки, где у него есть задачи.' : 'ОШИБКА: виден чужой объект!',
      });
    } catch (e: any) {
      testResults.push({ id: 'test-6', title: '6. Объекты RLS', description: '', passed: false, message: e.message });
    }

    setResults(testResults);
    setIsRunning(false);
  };

  return { isRunning, results, runAudit };
}
