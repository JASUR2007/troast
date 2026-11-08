-- 02_security_and_transitions.sql
-- Безопасность (RLS), функции валидации переходов и триггеры

-- 1. Вспомогательная функция для безопасного получения роли текущего пользователя
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Включение Row Level Security (RLS) на всех таблицах
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- 3. Политики безопасности для PROFILES
-- ----------------------------------------------------
-- Авторизованные пользователи могут просматривать профили (нужно для отображения ФИО и выбора исполнителя)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Клиентам ЗАПРЕЩЕНО напрямую создавать, менять или удалять профили/роли
DROP POLICY IF EXISTS "Prevent client insert on profiles" ON public.profiles;
CREATE POLICY "Prevent client insert on profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Prevent client update on profiles" ON public.profiles;
CREATE POLICY "Prevent client update on profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (false);

DROP POLICY IF EXISTS "Prevent client delete on profiles" ON public.profiles;
CREATE POLICY "Prevent client delete on profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (false);

-- ----------------------------------------------------
-- 4. Политики безопасности для OBJECTS
-- ----------------------------------------------------
-- Постановщик видит все объекты и управляет ими
DROP POLICY IF EXISTS "Managers full access to objects" ON public.objects;
CREATE POLICY "Managers full access to objects"
ON public.objects FOR ALL
TO authenticated
USING (public.get_my_role() = 'manager')
WITH CHECK (public.get_my_role() = 'manager');

-- Исполнитель видит только те объекты, в которых у него есть назначенные задачи
DROP POLICY IF EXISTS "Executors can view objects with assigned tasks" ON public.objects;
CREATE POLICY "Executors can view objects with assigned tasks"
ON public.objects FOR SELECT
TO authenticated
USING (
    public.get_my_role() = 'executor' AND
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE public.tasks.object_id = public.objects.id
          AND public.tasks.assignee_id = auth.uid()
    )
);

-- ----------------------------------------------------
-- 5. Политики безопасности для TASKS
-- ----------------------------------------------------
-- Постановщик видит все задачи, создаёт, редактирует и удаляет их
DROP POLICY IF EXISTS "Managers full access to tasks" ON public.tasks;
CREATE POLICY "Managers full access to tasks"
ON public.tasks FOR ALL
TO authenticated
USING (public.get_my_role() = 'manager')
WITH CHECK (public.get_my_role() = 'manager');

-- Исполнитель видит ТОЛЬКО свои задачи
DROP POLICY IF EXISTS "Executors can view only assigned tasks" ON public.tasks;
CREATE POLICY "Executors can view only assigned tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (
    public.get_my_role() = 'executor' AND
    assignee_id = auth.uid()
);

-- Исполнитель может обновлять только свои задачи (дополнительные ограничения на поля проверяются триггером)
DROP POLICY IF EXISTS "Executors can update only assigned tasks" ON public.tasks;
CREATE POLICY "Executors can update only assigned tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (
    public.get_my_role() = 'executor' AND
    assignee_id = auth.uid()
)
WITH CHECK (
    public.get_my_role() = 'executor' AND
    assignee_id = auth.uid()
);

-- ----------------------------------------------------
-- 6. Политики безопасности для TASK_HISTORY
-- ----------------------------------------------------
-- Постановщик видит всю историю
DROP POLICY IF EXISTS "Managers can view all task history" ON public.task_history;
CREATE POLICY "Managers can view all task history"
ON public.task_history FOR SELECT
TO authenticated
USING (public.get_my_role() = 'manager');

-- Исполнитель видит историю ТОЛЬКО тех задач, которые ему назначены
DROP POLICY IF EXISTS "Executors can view history of assigned tasks" ON public.task_history;
CREATE POLICY "Executors can view history of assigned tasks"
ON public.task_history FOR SELECT
TO authenticated
USING (
    public.get_my_role() = 'executor' AND
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE public.tasks.id = public.task_history.task_id
          AND public.tasks.assignee_id = auth.uid()
    )
);

-- Клиентам напрямую ЗАПРЕЩЕНО вставлять, изменять или удалять историю
DROP POLICY IF EXISTS "Prevent client insert on task_history" ON public.task_history;
CREATE POLICY "Prevent client insert on task_history"
ON public.task_history FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Prevent client update on task_history" ON public.task_history;
CREATE POLICY "Prevent client update on task_history"
ON public.task_history FOR UPDATE
TO authenticated
USING (false);

DROP POLICY IF EXISTS "Prevent client delete on task_history" ON public.task_history;
CREATE POLICY "Prevent client delete on task_history"
ON public.task_history FOR DELETE
TO authenticated
USING (false);

-- ----------------------------------------------------
-- 7. Триггер фиксации создания задачи в истории
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_task_created_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES (NEW.id, NEW.author_id, NULL, NEW.status, 'Задача создана', timezone('utc'::text, now()));
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_created ON public.tasks;
CREATE TRIGGER trg_task_created
AFTER INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.trg_task_created_fn();

-- ----------------------------------------------------
-- 8. Защита целостности при прямых UPDATE (через REST API)
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_validate_task_update_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role user_role;
    v_uid UUID;
BEGIN
    v_uid := auth.uid();
    v_user_role := public.get_my_role();

    -- Если действие выполняет исполнитель:
    IF v_user_role = 'executor' THEN
        -- Запрещено менять любые поля, кроме статуса
        IF (OLD.title IS DISTINCT FROM NEW.title) OR
           (OLD.description IS DISTINCT FROM NEW.description) OR
           (OLD.object_id IS DISTINCT FROM NEW.object_id) OR
           (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) OR
           (OLD.author_id IS DISTINCT FROM NEW.author_id) OR
           (OLD.created_at IS DISTINCT FROM NEW.created_at) THEN
            RAISE EXCEPTION 'Исполнитель не имеет права изменять основные реквизиты задачи (только статус)';
        END IF;

        -- Разрешённые переходы для исполнителя:
        -- Новая -> В работе
        -- В работе -> На проверке
        -- На доработке -> В работе
        IF NOT (
            (OLD.status = 'new' AND NEW.status = 'in_progress') OR
            (OLD.status = 'in_progress' AND NEW.status = 'review') OR
            (OLD.status = 'rework' AND NEW.status = 'in_progress')
        ) THEN
            RAISE EXCEPTION 'Недопустимый переход статуса для исполнителя: % -> %', OLD.status, NEW.status;
        END IF;
    END IF;

    -- Если действие выполняет постановщик и меняется статус:
    IF v_user_role = 'manager' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Разрешённые переходы статусов для постановщика:
        -- На проверке -> Принята
        -- На проверке -> На доработке
        IF NOT (
            (OLD.status = 'review' AND NEW.status = 'accepted') OR
            (OLD.status = 'review' AND NEW.status = 'rework')
        ) THEN
            RAISE EXCEPTION 'Недопустимый переход статуса для постановщика: % -> %', OLD.status, NEW.status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_task_update ON public.tasks;
CREATE TRIGGER trg_validate_task_update
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.trg_validate_task_update_fn();

-- ----------------------------------------------------
-- 9. RPC Функция: атомарный и безопасный переход статуса
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.transition_task(
    p_task_id UUID,
    p_expected_status task_status,
    p_target_status task_status,
    p_comment TEXT DEFAULT ''
)
RETURNS public.tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_task public.tasks%ROWTYPE;
    v_uid UUID;
    v_role user_role;
    v_trimmed_comment TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Требуется авторизация';
    END IF;

    -- Блокируем строку задачи для исключения race conditions
    SELECT * INTO v_task
    FROM public.tasks
    WHERE id = p_task_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Задача с указанным ID не найдена';
    END IF;

    -- Проверка оптимистичной блокировки (состояние на момент клика пользователя)
    IF v_task.status <> p_expected_status THEN
        RAISE EXCEPTION 'Конфликт состояния: ожидался статус %, но текущий статус задачи %', v_task.status, p_expected_status;
    END IF;

    v_role := public.get_my_role();
    v_trimmed_comment := trim(COALESCE(p_comment, ''));

    -- Валидация прав и матрицы переходов
    IF v_role = 'executor' THEN
        IF v_task.assignee_id <> v_uid THEN
            RAISE EXCEPTION 'Вы можете менять статус только назначенных вам задач';
        END IF;

        IF v_task.status = 'new' AND p_target_status = 'in_progress' THEN
            -- OK: Новая -> В работе
        ELSIF v_task.status = 'in_progress' AND p_target_status = 'review' THEN
            -- OK: В работе -> На проверке
        ELSIF v_task.status = 'rework' AND p_target_status = 'in_progress' THEN
            -- OK: На доработке -> В работе
        ELSE
            RAISE EXCEPTION 'Недопустимый переход статуса для исполнителя: % -> %', v_task.status, p_target_status;
        END IF;

    ELSIF v_role = 'manager' THEN
        IF v_task.status = 'review' AND p_target_status = 'accepted' THEN
            -- OK: На проверке -> Принята
        ELSIF v_task.status = 'review' AND p_target_status = 'rework' THEN
            -- OK: На проверке -> На доработке, но ОБЯЗАТЕЛЕН комментарий
            IF length(v_trimmed_comment) = 0 THEN
                RAISE EXCEPTION 'При возврате задачи на доработку комментарий обязателен';
            END IF;
        ELSE
            RAISE EXCEPTION 'Недопустимый переход статуса для постановщика: % -> %', v_task.status, p_target_status;
        END IF;
    ELSE
        RAISE EXCEPTION 'Неизвестная роль пользователя';
    END IF;

    -- Обновляем статус задачи
    UPDATE public.tasks
    SET status = p_target_status
    WHERE id = p_task_id
    RETURNING * INTO v_task;

    -- Записываем факт смены статуса в неизменяемую историю
    INSERT INTO public.task_history (
        task_id,
        actor_id,
        from_status,
        to_status,
        comment,
        created_at
    ) VALUES (
        p_task_id,
        v_uid,
        p_expected_status,
        p_target_status,
        v_trimmed_comment,
        timezone('utc'::text, now())
    );

    RETURN v_task;
END;
$$;

-- Предоставляем права вызова RPC авторизованным пользователям
GRANT EXECUTE ON FUNCTION public.transition_task TO authenticated;
