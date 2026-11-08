-- =====================================================================
-- ОЧИСТКА ДУБЛИКАТОВ ИСТОРИИ (ЕСЛИ СИД ЗАПУСКАЛСЯ НЕСКОЛЬКО РАЗ)
-- =====================================================================
DELETE FROM public.task_history a
USING public.task_history b
WHERE a.id > b.id
  AND a.task_id = b.task_id
  AND a.from_status IS NOT DISTINCT FROM b.from_status
  AND a.to_status = b.to_status
  AND a.comment = b.comment;
