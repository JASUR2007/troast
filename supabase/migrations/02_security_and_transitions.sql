-- 02_security_and_transitions.sql
-- Безопасность (RLS), функции валидации переходов, триггеры и защита от обходов

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES RLS
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Prevent client insert on profiles" ON public.profiles;
CREATE POLICY "Prevent client insert on profiles"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "Prevent client update on profiles" ON public.profiles;
CREATE POLICY "Prevent client update on profiles"
ON public.profiles FOR UPDATE TO authenticated USING (false);

DROP POLICY IF EXISTS "Prevent client delete on profiles" ON public.profiles;
CREATE POLICY "Prevent client delete on profiles"
ON public.profiles FOR DELETE TO authenticated USING (false);

-- 2. OBJECTS RLS
DROP POLICY IF EXISTS "Managers full access to objects" ON public.objects;
CREATE POLICY "Managers full access to objects"
ON public.objects FOR ALL TO authenticated
USING (public.get_my_role() = 'manager')
WITH CHECK (public.get_my_role() = 'manager');

DROP POLICY IF EXISTS "Executors can view objects with assigned tasks" ON public.objects;
CREATE POLICY "Executors can view objects with assigned tasks"
ON public.objects FOR SELECT TO authenticated
USING (
    public.get_my_role() = 'executor' AND
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE public.tasks.object_id = public.objects.id
          AND public.tasks.assignee_id = auth.uid()
    )
);

-- 3. TASKS RLS
DROP POLICY IF EXISTS "Managers full access to tasks" ON public.tasks;
CREATE POLICY "Managers full access to tasks"
ON public.tasks FOR ALL TO authenticated
USING (public.get_my_role() = 'manager')
WITH CHECK (public.get_my_role() = 'manager');

DROP POLICY IF EXISTS "Executors can view only assigned tasks" ON public.tasks;
CREATE POLICY "Executors can view only assigned tasks"
ON public.tasks FOR SELECT TO authenticated
USING (public.get_my_role() = 'executor' AND assignee_id = auth.uid());

DROP POLICY IF EXISTS "Executors can update only assigned tasks" ON public.tasks;
CREATE POLICY "Executors can update only assigned tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (public.get_my_role() = 'executor' AND assignee_id = auth.uid())
WITH CHECK (public.get_my_role() = 'executor' AND assignee_id = auth.uid());

-- 4. TASK_HISTORY RLS
DROP POLICY IF EXISTS "Managers can view all task history" ON public.task_history;
CREATE POLICY "Managers can view all task history"
ON public.task_history FOR SELECT TO authenticated
USING (public.get_my_role() = 'manager');

DROP POLICY IF EXISTS "Executors can view history of assigned tasks" ON public.task_history;
CREATE POLICY "Executors can view history of assigned tasks"
ON public.task_history FOR SELECT TO authenticated
USING (
    public.get_my_role() = 'executor' AND
    EXISTS (
        SELECT 1 FROM public.tasks
        WHERE public.tasks.id = public.task_history.task_id
          AND public.tasks.assignee_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Prevent client insert on task_history" ON public.task_history;
CREATE POLICY "Prevent client insert on task_history"
ON public.task_history FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "Prevent client update on task_history" ON public.task_history;
CREATE POLICY "Prevent client update on task_history"
ON public.task_history FOR UPDATE TO authenticated USING (false);

DROP POLICY IF EXISTS "Prevent client delete on task_history" ON public.task_history;
CREATE POLICY "Prevent client delete on task_history"
ON public.task_history FOR DELETE TO authenticated USING (false);

-- 5. ТРИГГЕР ПРОВЕРКИ СОЗДАНИЯ ЗАДАЧИ (Защита от подмены статуса, автора и исполнителя)
CREATE OR REPLACE FUNCTION public.trg_validate_task_insert_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF length(trim(COALESCE(NEW.title, ''))) = 0 THEN
        RAISE EXCEPTION 'Название задачи не может быть пустым';
    END IF;

    -- Новая задача ВСЕГДА создаётся в статусе 'new'
    IF NEW.status IS DISTINCT FROM 'new' THEN
        RAISE EXCEPTION 'Новая задача может быть создана только в статусе new';
    END IF;

    -- Автор задачи ВСЕГДА текущий авторизованный пользователь
    IF auth.uid() IS NOT NULL THEN
        NEW.author_id := auth.uid();
    END IF;

    -- Исполнителем может быть назначен только пользователь с ролью 'executor'
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.assignee_id AND role = 'executor') THEN
        RAISE EXCEPTION 'Исполнителем может быть назначен только пользователь с ролью executor';
    END IF;

    NEW.created_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_task_insert ON public.tasks;
CREATE TRIGGER trg_validate_task_insert
BEFORE INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.trg_validate_task_insert_fn();

-- 6. ТРИГГЕР НАЧАЛЬНОЙ ИСТОРИИ СОЗДАНИЯ ЗАДАЧИ
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

-- 7. ТРИГГЕР ЗАЩИТЫ UPDATE (Запрет прямого изменения status в обход transition_task)
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

    -- Запрет модификации автора и даты создания
    IF (OLD.author_id IS DISTINCT FROM NEW.author_id) OR (OLD.created_at IS DISTINCT FROM NEW.created_at) THEN
        RAISE EXCEPTION 'Изменение автора и даты создания задачи запрещено';
    END IF;

    -- КЛЮЧЕВАЯ ЗАЩИТА: Прямое изменение status через REST API запрещено!
    -- Смена статуса допускается ТОЛЬКО через функцию transition_task()
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        IF current_setting('app.in_transition_rpc', true) IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'Прямое изменение статуса через API запрещено. Используйте transition_task()';
        END IF;
    END IF;

    -- Если действие выполняет исполнитель:
    IF v_user_role = 'executor' THEN
        IF (OLD.title IS DISTINCT FROM NEW.title) OR
           (OLD.description IS DISTINCT FROM NEW.description) OR
           (OLD.object_id IS DISTINCT FROM NEW.object_id) OR
           (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) THEN
            RAISE EXCEPTION 'Исполнитель не имеет права изменять реквизиты задачи';
        END IF;
    END IF;

    -- Если меняется исполнитель (переназначение постановщиком):
    IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
        IF v_user_role <> 'manager' THEN
            RAISE EXCEPTION 'Только постановщик может переназначать исполнителя';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.assignee_id AND role = 'executor') THEN
            RAISE EXCEPTION 'Новый исполнитель обязан иметь роль executor';
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

-- 8. ТРИГГЕР ВАЛИДАЦИИ ОБЪЕКТОВ
CREATE OR REPLACE FUNCTION public.trg_validate_object_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF length(trim(COALESCE(NEW.name, ''))) = 0 OR length(trim(COALESCE(NEW.address, ''))) = 0 THEN
        RAISE EXCEPTION 'Название и адрес строительного объекта обязательны';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_object ON public.objects;
CREATE TRIGGER trg_validate_object
BEFORE INSERT OR UPDATE ON public.objects
FOR EACH ROW
EXECUTE FUNCTION public.trg_validate_object_fn();

-- 9. АТОМАРНАЯ ФУНКЦИЯ TRANSITION_TASK С БЛОКИРОВКОЙ И ИСТОРИЕЙ
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

    SELECT * INTO v_task
    FROM public.tasks
    WHERE id = p_task_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Задача с указанным ID не найдена';
    END IF;

    IF v_task.status <> p_expected_status THEN
        RAISE EXCEPTION 'Конфликт состояния: ожидался статус %, но текущий статус %', v_task.status, p_expected_status;
    END IF;

    v_role := public.get_my_role();
    v_trimmed_comment := trim(COALESCE(p_comment, ''));

    IF v_role = 'executor' THEN
        IF v_task.assignee_id <> v_uid THEN
            RAISE EXCEPTION 'Вы можете менять статус только назначенных вам задач';
        END IF;

        IF NOT (
            (v_task.status = 'new' AND p_target_status = 'in_progress') OR
            (v_task.status = 'in_progress' AND p_target_status = 'review') OR
            (v_task.status = 'rework' AND p_target_status = 'in_progress')
        ) THEN
            RAISE EXCEPTION 'Недопустимый переход статуса для исполнителя: % -> %', v_task.status, p_target_status;
        END IF;

    ELSIF v_role = 'manager' THEN
        IF v_task.status = 'review' AND p_target_status = 'accepted' THEN
            -- OK
        ELSIF v_task.status = 'review' AND p_target_status = 'rework' THEN
            IF length(v_trimmed_comment) = 0 THEN
                RAISE EXCEPTION 'При возврате задачи на доработку комментарий обязателен';
            END IF;
        ELSE
            RAISE EXCEPTION 'Недопустимый переход статуса для постановщика: % -> %', v_task.status, p_target_status;
        END IF;
    ELSE
        RAISE EXCEPTION 'Неизвестная роль пользователя';
    END IF;

    -- Устанавливаем локальный флаг транзакции, разрешающий изменение status триггеру
    PERFORM set_config('app.in_transition_rpc', 'true', true);

    UPDATE public.tasks
    SET status = p_target_status
    WHERE id = p_task_id
    RETURNING * INTO v_task;

    INSERT INTO public.task_history (
        task_id, actor_id, from_status, to_status, comment, created_at
    ) VALUES (
        p_task_id, v_uid, p_expected_status, p_target_status, v_trimmed_comment, timezone('utc'::text, now())
    );

    RETURN v_task;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transition_task TO authenticated;
