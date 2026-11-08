-- =====================================================================
-- TROAST CRM — ПОЛНЫЙ СКРИПТ НАСТРОЙКИ БАЗЫ ДАННЫХ (SUPABASE SQL EDITOR)
-- Включает: схему, RLS политики, RPC функцию переходов, триггеры и сид-данные
-- =====================================================================

-- 1. СХЕМА ТАБЛИЦ И ТИПОВ
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('manager', 'executor');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('new', 'in_progress', 'review', 'accepted', 'rework');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '' NOT NULL,
    object_id UUID NOT NULL REFERENCES public.objects(id) ON DELETE CASCADE,
    assignee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status task_status DEFAULT 'new'::task_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    from_status task_status,
    to_status task_status NOT NULL,
    comment TEXT DEFAULT '' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_object_id ON public.tasks(object_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id_created_at ON public.task_history(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. БЕЗОПАСНОСТЬ (RLS) И ФУНКЦИИ
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

-- Профили: чтение для авторизованных, изменение через API запрещено
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

-- Объекты: постановщик управляет всеми; исполнитель видит только объекты со своими задачами
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

-- Задачи: постановщик управляет всеми; исполнитель видит только назначенные и меняет только статус
DROP POLICY IF EXISTS "Managers full access to tasks" ON public.tasks;
CREATE POLICY "Managers full access to tasks"
ON public.tasks FOR ALL TO authenticated
USING (public.get_my_role() = 'manager')
WITH CHECK (public.get_my_role() = 'manager');

DROP POLICY IF EXISTS "Executors can view only assigned tasks" ON public.tasks;
CREATE POLICY "Executors can view only assigned tasks"
ON public.tasks FOR SELECT TO authenticated
USING (
    public.get_my_role() = 'executor' AND
    assignee_id = auth.uid()
);

DROP POLICY IF EXISTS "Executors can update only assigned tasks" ON public.tasks;
CREATE POLICY "Executors can update only assigned tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (
    public.get_my_role() = 'executor' AND
    assignee_id = auth.uid()
)
WITH CHECK (
    public.get_my_role() = 'executor' AND
    assignee_id = auth.uid()
);

-- История задач: постановщик видит все; исполнитель видит только для своих задач; модификация через API закрыта
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

-- Триггер начальной записи истории при создании задачи
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

-- Триггер контроля переходов и неизменяемости полей при прямом REST UPDATE
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

    IF v_user_role = 'executor' THEN
        IF (OLD.title IS DISTINCT FROM NEW.title) OR
           (OLD.description IS DISTINCT FROM NEW.description) OR
           (OLD.object_id IS DISTINCT FROM NEW.object_id) OR
           (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) OR
           (OLD.author_id IS DISTINCT FROM NEW.author_id) OR
           (OLD.created_at IS DISTINCT FROM NEW.created_at) THEN
            RAISE EXCEPTION 'Исполнитель не имеет права изменять основные реквизиты задачи (только статус)';
        END IF;

        IF NOT (
            (OLD.status = 'new' AND NEW.status = 'in_progress') OR
            (OLD.status = 'in_progress' AND NEW.status = 'review') OR
            (OLD.status = 'rework' AND NEW.status = 'in_progress')
        ) THEN
            RAISE EXCEPTION 'Недопустимый переход статуса для исполнителя: % -> %', OLD.status, NEW.status;
        END IF;
    END IF;

    IF v_user_role = 'manager' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
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

-- Атомарный переход статуса (RPC)
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
        RAISE EXCEPTION 'Конфликт состояния: ожидался статус %, но текущий статус задачи %', v_task.status, p_expected_status;
    END IF;

    v_role := public.get_my_role();
    v_trimmed_comment := trim(COALESCE(p_comment, ''));

    IF v_role = 'executor' THEN
        IF v_task.assignee_id <> v_uid THEN
            RAISE EXCEPTION 'Вы можете менять статус только назначенных вам задач';
        END IF;

        IF v_task.status = 'new' AND p_target_status = 'in_progress' THEN
            -- OK
        ELSIF v_task.status = 'in_progress' AND p_target_status = 'review' THEN
            -- OK
        ELSIF v_task.status = 'rework' AND p_target_status = 'in_progress' THEN
            -- OK
        ELSE
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

    UPDATE public.tasks
    SET status = p_target_status
    WHERE id = p_task_id
    RETURNING * INTO v_task;

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

GRANT EXECUTE ON FUNCTION public.transition_task TO authenticated;

-- 3. ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ И ДЕМО-ДАННЫЕ
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_manager_id UUID := 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    v_exec1_id   UUID := '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    v_exec2_id   UUID := '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
    
    v_obj1_id    UUID := '3fa85f64-5717-4562-b3fc-2c963f66afa6';
    v_obj2_id    UUID := '7c9e6679-7425-40de-944b-e07fc1f90ae7';
    v_obj3_id    UUID := '8d2f5a34-2e11-4b6c-9c71-3f4a8b9c0d12';

    v_task1_id   UUID := 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c81';
    v_task2_id   UUID := 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c82';
    v_task3_id   UUID := 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c83';
    v_task4_id   UUID := 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c84';
    v_task5_id   UUID := 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c85';
    v_task6_id   UUID := 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c86';
    
    v_password_hash TEXT;
BEGIN
    v_password_hash := crypt('TestPass123!', gen_salt('bf'));

    -- Пользователи auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_manager_id OR email = 'manager@troast.ru') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_manager_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'manager@troast.ru', v_password_hash, now(),
            '{"provider":"email","providers":["email"]}', '{"display_name":"Алексей Смирнов (Руководитель)"}',
            now(), now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_exec1_id OR email = 'alex@troast.ru') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_exec1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'alex@troast.ru', v_password_hash, now(),
            '{"provider":"email","providers":["email"]}', '{"display_name":"Александр Воронов (Электрик)"}',
            now(), now()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_exec2_id OR email = 'dmitry@troast.ru') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_exec2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'dmitry@troast.ru', v_password_hash, now(),
            '{"provider":"email","providers":["email"]}', '{"display_name":"Дмитрий Кузнецов (Прораб)"}',
            now(), now()
        );
    END IF;

    -- Профили
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES
        (v_manager_id, 'manager@troast.ru', 'Алексей Смирнов (Руководитель)', 'manager'),
        (v_exec1_id, 'alex@troast.ru', 'Александр Воронов (Электрик)', 'executor'),
        (v_exec2_id, 'dmitry@troast.ru', 'Дмитрий Кузнецов (Прораб)', 'executor')
    ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role;

    -- Объекты
    INSERT INTO public.objects (id, name, address)
    VALUES
        (v_obj1_id, 'ЖК «Северные Высоты»', 'г. Москва, ул. Полярная, д. 14'),
        (v_obj2_id, 'Бизнес-центр «Аврора»', 'г. Санкт-Петербург, Лиговский пр-т, д. 48'),
        (v_obj3_id, 'СК «Южный Логистик»', 'г. Казань, ул. Промышленная, д. 5')
    ON CONFLICT (id) DO NOTHING;

    -- Задачи
    ALTER TABLE public.tasks DISABLE TRIGGER trg_task_created;
    ALTER TABLE public.tasks DISABLE TRIGGER trg_validate_task_update;

    INSERT INTO public.tasks (id, title, description, object_id, assignee_id, author_id, status, created_at)
    VALUES 
        (v_task1_id, 'Монтаж кабельных трасс 4 этажа', 'Прокладка лотков и разводка силового кабеля по коридорам 4-го этажа согласно схеме ЭОМ-12.', v_obj1_id, v_exec1_id, v_manager_id, 'new', now() - INTERVAL '3 days'),
        (v_task2_id, 'Установка щитов автоматики в венткамере', 'Сборка и расключение распределительного шкафа ЩА-1, проверка автоматов и клеммных колодок.', v_obj1_id, v_exec1_id, v_manager_id, 'in_progress', now() - INTERVAL '2 days'),
        (v_task3_id, 'Пусконаладка пожарной сигнализации', 'Тестирование датчиков задымления и системы оповещения на 1 и 2 этажах.', v_obj1_id, v_exec1_id, v_manager_id, 'review', now() - INTERVAL '4 days'),
        (v_task4_id, 'Утепление фасада минеральной ватой', 'Монтаж плит утеплителя 100 мм и ветрозащитной мембраны по внешней стене секции 2.', v_obj2_id, v_exec2_id, v_manager_id, 'rework', now() - INTERVAL '5 days'),
        (v_task5_id, 'Заливка стяжки полов секции Б', 'Полусухая стяжка по маякам с добавлением фиброволокна, толщина 70 мм.', v_obj1_id, v_exec2_id, v_manager_id, 'accepted', now() - INTERVAL '6 days'),
        (v_task6_id, 'Устройство песчаной подушки под фундамент', 'Послойная отсыпка и вибротрамбование песка средней крупности, толщина слоя 30 см.', v_obj3_id, v_exec2_id, v_manager_id, 'new', now() - INTERVAL '1 day')
    ON CONFLICT (id) DO NOTHING;

    ALTER TABLE public.tasks ENABLE TRIGGER trg_task_created;
    ALTER TABLE public.tasks ENABLE TRIGGER trg_validate_task_update;

    -- История
    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES (v_task1_id, v_manager_id, NULL, 'new', 'Задача создана', now() - INTERVAL '3 days')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES 
        (v_task2_id, v_manager_id, NULL, 'new', 'Задача создана', now() - INTERVAL '2 days'),
        (v_task2_id, v_exec1_id, 'new', 'in_progress', 'Приступил к сборке щита', now() - INTERVAL '1 day 18 hours')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES 
        (v_task3_id, v_manager_id, NULL, 'new', 'Задача создана', now() - INTERVAL '4 days'),
        (v_task3_id, v_exec1_id, 'new', 'in_progress', 'Начал монтаж и проверку шлейфов', now() - INTERVAL '3 days 20 hours'),
        (v_task3_id, v_exec1_id, 'in_progress', 'review', 'Все датчики протестированы, акты подписаны со стороны бригады', now() - INTERVAL '5 hours')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES 
        (v_task4_id, v_manager_id, NULL, 'new', 'Задача создана', now() - INTERVAL '5 days'),
        (v_task4_id, v_exec2_id, 'new', 'in_progress', 'Бригада вышла на монтаж утеплителя', now() - INTERVAL '4 days 12 hours'),
        (v_task4_id, v_exec2_id, 'in_progress', 'review', 'Фасад утеплен, готов к сдаче', now() - INTERVAL '2 days'),
        (v_task4_id, v_manager_id, 'review', 'rework', 'Обнаружены зазоры между плитами по оси 3-5, исправить гидроизоляцию мембраны', now() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES 
        (v_task5_id, v_manager_id, NULL, 'new', 'Задача создана', now() - INTERVAL '6 days'),
        (v_task5_id, v_exec2_id, 'new', 'in_progress', 'Завезли раствор и технику', now() - INTERVAL '5 days 10 hours'),
        (v_task5_id, v_exec2_id, 'in_progress', 'review', 'Стяжка высохла, перепады проверены уровнем — в норме', now() - INTERVAL '2 days 14 hours'),
        (v_task5_id, v_manager_id, 'review', 'accepted', 'Принято без замечаний, геометрия и прочность соответствуют СП', now() - INTERVAL '1 day 8 hours')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES (v_task6_id, v_manager_id, NULL, 'new', 'Задача создана', now() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

END $$;
