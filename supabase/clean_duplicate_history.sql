-- =====================================================================
-- БЕЗОПАСНАЯ ОЧИСТКА ТОЛЬКО ДУБЛИКАТОВ СИДА (SEED TASKS ONLY)
-- =====================================================================
-- Скрипт затрагивает ИСКЛЮЧИТЕЛЬНО 6 начальных демонстрационных задач
-- и НЕ трогает реальные пользовательские задачи или повторные циклы доработки.

-- 1. Предварительный просмотр кандидатов на удаление (запустите для проверки):
SELECT id, task_id, from_status, to_status, comment, created_at
FROM public.task_history
WHERE task_id IN (
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c81'::uuid,
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c82'::uuid,
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c83'::uuid,
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c84'::uuid,
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c85'::uuid,
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c86'::uuid
)
AND id NOT IN (
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000001'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000002'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000003'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000004'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000005'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000006'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000007'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000008'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000009'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000010'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000011'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000012'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000013'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000014'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000015'::uuid
);

-- 2. Безопасное удаление только лишних дубликатов старого сида:
DELETE FROM public.task_history
WHERE task_id IN (
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c81'::uuid,
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c82'::uuid,
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c83'::uuid,
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c84'::uuid,
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c85'::uuid,
    'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c86'::uuid
)
AND id NOT IN (
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000001'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000002'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000003'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000004'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000005'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000006'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000007'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000008'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000009'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000010'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000011'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000012'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000013'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000014'::uuid,
    'b1b2c3d4-e5f6-4a1b-8c2d-000000000015'::uuid
);
