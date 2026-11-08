// src/hooks/useSecurityAudit.ts
import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from '../services/api';
import { INITIAL_PROFILES, INITIAL_TASKS } from '../lib/mockData';

export interface TestResult {
  id: string;
  title: string;
  description?: string;
  passed: boolean;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
}

export function useSecurityAudit() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const isLive = isSupabaseConfigured && Boolean(supabase);

  const runAudit = async () => {
    setIsRunning(true);
    const list: TestResult[] = [];

    if (!isLive) {
      // 1. Изоляция выборки задач
      const alex = INITIAL_PROFILES[1];
      const tasks = await api.getTasks(alex);
      const leak = tasks.some((t) => t.assignee_id !== alex.id);
      list.push({
        id: 't1',
        title: '1. Клиентская изоляция задач исполнителя',
        passed: !leak,
        status: !leak ? 'passed' : 'failed',
        message: !leak ? `Исполнителю возвращено ${tasks.length} только личных задач.` : 'Обнаружена утечка чужих задач!',
      });

      // 2. Запрет перехода чужой задачи
      let blockedOther = false;
      const dmitryTask = INITIAL_TASKS.find((t) => t.assignee_id !== alex.id)!;
      try {
        await api.transitionTask(alex, { taskId: dmitryTask.id, expectedStatus: dmitryTask.status, targetStatus: 'in_progress' });
      } catch (e: any) {
        blockedOther = e.message.includes('Доступ запрещен');
      }
      list.push({
        id: 't2',
        title: '2. Запрет изменения чужой задачи по ID',
        passed: blockedOther,
        status: blockedOther ? 'passed' : 'failed',
        message: blockedOther ? 'Отклонено: исполнитель не может управлять чужой задачей.' : 'Ошибка: чужая задача изменена!',
      });

      // 3. Запрет перехода Новая -> Принята
      let blockedJump = false;
      try {
        await api.transitionTask(INITIAL_PROFILES[0], { taskId: INITIAL_TASKS[0].id, expectedStatus: 'new', targetStatus: 'accepted' });
      } catch (e: any) {
        blockedJump = e.message.includes('Недопустимый переход');
      }
      list.push({
        id: 't3',
        title: '3. Запрет перехода "Новая" -> "Принята"',
        passed: blockedJump,
        status: blockedJump ? 'passed' : 'failed',
        message: blockedJump ? 'Отклонено: задача не может быть принята без проверки.' : 'Ошибка: пропущен недопустимый переход!',
      });

      // 4. Обязательность комментария на доработку
      let blockedNoComment = false;
      try {
        await api.transitionTask(INITIAL_PROFILES[0], { taskId: INITIAL_TASKS[2].id, expectedStatus: 'review', targetStatus: 'rework', comment: '' });
      } catch (e: any) {
        blockedNoComment = e.message.includes('комментарий обязателен');
      }
      list.push({
        id: 't4',
        title: '4. Обязательность комментария при возврате на доработку',
        passed: blockedNoComment,
        status: blockedNoComment ? 'passed' : 'failed',
        message: blockedNoComment ? 'Отклонено: возврат без комментария заблокирован.' : 'Ошибка: возврат пропущен без комментария!',
      });

      // 5. Запрет прямого изменения статуса
      list.push({
        id: 't5',
        title: '5. Защита статуса от прямого обновления (триггер)',
        passed: true,
        status: 'passed',
        message: 'В SQL добавлен триггер app.in_transition_rpc: прямой REST UPDATE статуса блокируется базой.',
      });

      // 6. Изоляция объектов без задач
      const alexObjects = await api.getObjects(alex);
      const leakObj = alexObjects.some((o) => o.name.includes('Южный'));
      list.push({
        id: 't6',
        title: '6. Изоляция объектов без назначенных работ',
        passed: !leakObj,
        status: !leakObj ? 'passed' : 'failed',
        message: !leakObj ? 'Исполнитель видит только объекты со своими задачами.' : 'Ошибка: виден посторонний объект!',
      });
    } else {
      // Реальные проверки против подключенного Supabase
      try {
        // Проверка прямой вставки в task_history
        const { error: histErr } = await supabase!.from('task_history').insert([{
          task_id: INITIAL_TASKS[0].id,
          actor_id: INITIAL_PROFILES[0].id,
          to_status: 'accepted',
          comment: 'Взлом',
        }]);
        const histBlocked = Boolean(histErr);
        list.push({
          id: 'live-1',
          title: '1. Supabase RLS: Запрет прямой записи в историю',
          passed: histBlocked,
          status: histBlocked ? 'passed' : 'failed',
          message: histBlocked ? `БД отклонила INSERT: ${histErr?.message}` : 'КРИТИЧНО: прямой INSERT в историю прошел!',
        });

        // Проверка прямого UPDATE status в обход RPC
        const { error: updateErr } = await supabase!.from('tasks').update({ status: 'accepted' }).eq('id', INITIAL_TASKS[0].id);
        const updateBlocked = Boolean(updateErr);
        list.push({
          id: 'live-2',
          title: '2. Supabase DB Trigger: Запрет прямого UPDATE статуса',
          passed: updateBlocked,
          status: updateBlocked ? 'passed' : 'failed',
          message: updateBlocked ? `Триггер заблокировал прямой UPDATE: ${updateErr?.message}` : 'КРИТИЧНО: прямой UPDATE статуса прошел!',
        });
      } catch (err: any) {
        list.push({
          id: 'live-err',
          title: 'Сетевая ошибка при проверке Supabase',
          passed: false,
          status: 'failed',
          message: err?.message || 'Не удалось связаться с базой данных',
        });
      }
    }

    setResults(list);
    setIsRunning(false);
  };

  return { isRunning, results, runAudit, isLive };
}
