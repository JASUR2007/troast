// src/hooks/useSecurityAudit.ts
import { useState } from 'react';
import { supabase, isLiveMode } from '../lib/supabase';
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

function isSecurityDenial(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = (err.message || '').toLowerCase();
  return (
    code === '42501' ||
    code === 'P0001' ||
    msg.includes('row-level security') ||
    msg.includes('permission denied') ||
    msg.includes('прямое изменение статуса') ||
    msg.includes('доступ запрещен')
  );
}

export function useSecurityAudit() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const isLive = isLiveMode();

  const runAudit = async () => {
    setIsRunning(true);
    const list: TestResult[] = [];

    if (!isLive) {
      const alex = INITIAL_PROFILES[1];
      const tasks = await api.getTasks(alex);
      const leak = tasks.some((t) => t.assignee_id !== alex.id);
      list.push({
        id: 't1', title: '1. Клиентская изоляция задач исполнителя', passed: !leak, status: !leak ? 'passed' : 'failed',
        message: !leak ? `Исполнителю возвращено ${tasks.length} только личных задач.` : 'Обнаружена утечка чужих задач!',
      });

      let blockedOther = false;
      const dmitryTask = INITIAL_TASKS.find((t) => t.assignee_id !== alex.id)!;
      try {
        await api.transitionTask(alex, { taskId: dmitryTask.id, expectedStatus: dmitryTask.status, targetStatus: 'in_progress' });
      } catch (e: any) { blockedOther = e.message.includes('Доступ запрещен'); }
      list.push({
        id: 't2', title: '2. Запрет изменения чужой задачи по ID', passed: blockedOther, status: blockedOther ? 'passed' : 'failed',
        message: blockedOther ? 'Отклонено: исполнитель не может управлять чужой задачей.' : 'Ошибка: чужая задача изменена!',
      });

      let blockedJump = false;
      try {
        await api.transitionTask(INITIAL_PROFILES[0], { taskId: INITIAL_TASKS[0].id, expectedStatus: 'new', targetStatus: 'accepted' });
      } catch (e: any) { blockedJump = e.message.includes('Недопустимый переход'); }
      list.push({
        id: 't3', title: '3. Запрет перехода "Новая" -> "Принята"', passed: blockedJump, status: blockedJump ? 'passed' : 'failed',
        message: blockedJump ? 'Отклонено: задача не может быть принята без проверки.' : 'Ошибка: пропущен недопустимый переход!',
      });

      let blockedNoComment = false;
      try {
        await api.transitionTask(INITIAL_PROFILES[0], { taskId: INITIAL_TASKS[2].id, expectedStatus: 'review', targetStatus: 'rework', comment: '' });
      } catch (e: any) { blockedNoComment = e.message.includes('комментарий обязателен'); }
      list.push({
        id: 't4', title: '4. Обязательность комментария при возврате на доработку', passed: blockedNoComment, status: blockedNoComment ? 'passed' : 'failed',
        message: blockedNoComment ? 'Отклонено: возврат без комментария заблокирован.' : 'Ошибка: возврат пропущен без комментария!',
      });

      const alexObjects = await api.getObjects(alex);
      const leakObj = alexObjects.some((o) => o.name.includes('Южный'));
      list.push({
        id: 't5', title: '5. Изоляция объектов без назначенных работ', passed: !leakObj, status: !leakObj ? 'passed' : 'failed',
        message: !leakObj ? 'Исполнитель видит только объекты со своими задачами.' : 'Ошибка: виден посторонний объект!',
      });
    } else {
      try {
        const { data: activeTasks, error: connErr } = await supabase!.from('tasks').select('id, status, title').limit(1);
        if (connErr || !activeTasks || activeTasks.length === 0) {
          throw new Error('База Supabase недоступна или нет активной авторизованной сессии');
        }

        const testTask = activeTasks[0];
        const { data: { user } } = await supabase!.auth.getUser();

        // Тест 1: Прямой INSERT в task_history
        const attackComment = `AuditAttack_${Date.now()}`;
        const { error: histErr } = await supabase!.from('task_history').insert([{
          task_id: testTask.id, actor_id: user?.id || INITIAL_PROFILES[0].id, to_status: 'accepted', comment: attackComment,
        }]);
        const { data: leakedHist } = await supabase!.from('task_history').select('id').eq('comment', attackComment);
        const histBlocked = isSecurityDenial(histErr) && (!leakedHist || leakedHist.length === 0);
        list.push({
          id: 'live-1', title: '1. Supabase RLS: Запрет прямой записи в историю', passed: histBlocked, status: histBlocked ? 'passed' : 'failed',
          message: histBlocked ? `БД отклонила несанкционированный INSERT (код: ${histErr?.code || 'RLS 42501'}). Данные не изменены.` : (histErr ? `Ошибка запроса (${histErr.message}), но не RLS отказ.` : 'КРИТИЧЕСКИЙ СБОЙ: запись добавлена в историю!'),
        });

        // Тест 2: Прямой UPDATE статуса в tasks
        const hackStatus = testTask.status === 'accepted' ? 'new' : 'accepted';
        const { error: updateErr } = await supabase!.from('tasks').update({ status: hackStatus }).eq('id', testTask.id);
        const { data: freshTask } = await supabase!.from('tasks').select('status').eq('id', testTask.id).single();
        const updateBlocked = isSecurityDenial(updateErr) && freshTask?.status === testTask.status;
        list.push({
          id: 'live-2', title: '2. DB Trigger: Запрет прямого изменения статуса', passed: updateBlocked, status: updateBlocked ? 'passed' : 'failed',
          message: updateBlocked ? `Триггер заблокировал прямой UPDATE: ${updateErr?.message || 'app.in_transition_rpc check'}. Статус сохранен.` : 'КРИТИЧЕСКИЙ СБОЙ: статус изменен в обход RPC!',
        });
      } catch (err: any) {
        list.push({
          id: 'live-err', title: 'Проверка подключения к Supabase', passed: false, status: 'failed',
          message: err?.message || 'Не удалось выполнить аудит БД',
        });
      }
    }

    setResults(list);
    setIsRunning(false);
  };

  return { isRunning, results, runAudit, isLive };
}
