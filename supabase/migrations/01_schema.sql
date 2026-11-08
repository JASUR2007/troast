-- 01_schema.sql
-- Создание таблиц, перечислений и базовых индексов для Troast CRM

-- 1. Создание перечислений (enums)
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

-- 2. Таблица profiles (профили пользователей, связанные с auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Таблица objects (объекты строительства)
CREATE TABLE IF NOT EXISTS public.objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Таблица tasks (задачи)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '' NOT NULL,
    object_id UUID NOT NULL REFERENCES public.objects(id) ON DELETE CASCADE,
    assignee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status task_status DEFAULT 'new'::task_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Таблица task_history (неизменяемая история статусов)
CREATE TABLE IF NOT EXISTS public.task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    from_status task_status,
    to_status task_status NOT NULL,
    comment TEXT DEFAULT '' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Индексы для оптимизации выборок и проверок RLS
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_object_id ON public.tasks(object_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id_created_at ON public.task_history(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
