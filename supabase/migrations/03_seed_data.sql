-- 03_seed_data.sql
-- Демонстрационные данные: 1 постановщик, 2 исполнителя, 3 объекта и задачи во всех статусах

-- Включение расширения pgcrypto для генерации хэшей паролей
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_manager_id UUID := '11111111-1111-1111-1111-111111111111';
    v_exec1_id   UUID := '22222222-2222-2222-2222-222222222222';
    v_exec2_id   UUID := '33333333-3333-3333-3333-333333333333';
    
    v_obj1_id    UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    v_obj2_id    UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    v_obj3_id    UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';

    v_task1_id   UUID := '10000000-0000-0000-0000-000000000001';
    v_task2_id   UUID := '10000000-0000-0000-0000-000000000002';
    v_task3_id   UUID := '10000000-0000-0000-0000-000000000003';
    v_task4_id   UUID := '10000000-0000-0000-0000-000000000004';
    v_task5_id   UUID := '10000000-0000-0000-0000-000000000005';
    v_task6_id   UUID := '10000000-0000-0000-0000-000000000006';
    
    v_password_hash TEXT;
BEGIN
    -- Хэш пароля 'TestPass123!' через crypt blowfish
    v_password_hash := crypt('TestPass123!', gen_salt('bf'));

    -- 1. Создание пользователей в auth.users
    -- Постановщик: manager@troast.ru
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

    -- Исполнитель 1: alex@troast.ru
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

    -- Исполнитель 2: dmitry@troast.ru
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

    -- 2. Заполнение public.profiles
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES
        (v_manager_id, 'manager@troast.ru', 'Алексей Смирнов (Руководитель)', 'manager'),
        (v_exec1_id, 'alex@troast.ru', 'Александр Воронов (Электрик)', 'executor'),
        (v_exec2_id, 'dmitry@troast.ru', 'Дмитрий Кузнецов (Прораб)', 'executor')
    ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role;

    -- 3. Объекты строительства
    INSERT INTO public.objects (id, name, address)
    VALUES
        (v_obj1_id, 'ЖК «Северные Высоты»', 'г. Москва, ул. Полярная, д. 14'),
        (v_obj2_id, 'Бизнес-центр «Аврора»', 'г. Санкт-Петербург, Лиговский пр-т, д. 48'),
        (v_obj3_id, 'СК «Южный Логистик»', 'г. Казань, ул. Промышленная, д. 5')
    ON CONFLICT (id) DO NOTHING;

    -- 4. Задачи в различных статусах
    -- Временно отключаем триггер авто-создания истории, чтобы вручную сформировать правдоподобную историю
    ALTER TABLE public.tasks DISABLE TRIGGER trg_task_created;
    ALTER TABLE public.tasks DISABLE TRIGGER trg_validate_task_update;

    -- Задача 1 (Новая, Исполнитель: Александр)
    INSERT INTO public.tasks (id, title, description, object_id, assignee_id, author_id, status, created_at)
    VALUES (
        v_task1_id,
        'Монтаж кабельных трасс 4 этажа',
        'Прокладка лотков и разводка силового кабеля по коридорам 4-го этажа согласно схеме ЭОМ-12.',
        v_obj1_id, v_exec1_id, v_manager_id, 'new', now() - INTERVAL '3 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Задача 2 (В работе, Исполнитель: Александр)
    INSERT INTO public.tasks (id, title, description, object_id, assignee_id, author_id, status, created_at)
    VALUES (
        v_task2_id,
        'Установка щитов автоматики в венткамере',
        'Сборка и расключение распределительного шкафа ЩА-1, проверка автоматов и клеммных колодок.',
        v_obj1_id, v_exec1_id, v_manager_id, 'in_progress', now() - INTERVAL '2 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Задача 3 (На проверке, Исполнитель: Александр)
    INSERT INTO public.tasks (id, title, description, object_id, assignee_id, author_id, status, created_at)
    VALUES (
        v_task3_id,
        'Пусконаладка пожарной сигнализации',
        'Тестирование датчиков задымления и системы оповещения на 1 и 2 этажах.',
        v_obj1_id, v_exec1_id, v_manager_id, 'review', now() - INTERVAL '4 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Задача 4 (На доработке, Исполнитель: Дмитрий)
    INSERT INTO public.tasks (id, title, description, object_id, assignee_id, author_id, status, created_at)
    VALUES (
        v_task4_id,
        'Утепление фасада минеральной ватой',
        'Монтаж плит утеплителя 100 мм и ветрозащитной мембраны по внешней стене секции 2.',
        v_obj2_id, v_exec2_id, v_manager_id, 'rework', now() - INTERVAL '5 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Задача 5 (Принята, Исполнитель: Дмитрий)
    INSERT INTO public.tasks (id, title, description, object_id, assignee_id, author_id, status, created_at)
    VALUES (
        v_task5_id,
        'Заливка стяжки полов секции Б',
        'Полусухая стяжка по маякам с добавлением фиброволокна, толщина 70 мм.',
        v_obj1_id, v_exec2_id, v_manager_id, 'accepted', now() - INTERVAL '6 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Задача 6 (Новая, Исполнитель: Дмитрий)
    INSERT INTO public.tasks (id, title, description, object_id, assignee_id, author_id, status, created_at)
    VALUES (
        v_task6_id,
        'Устройство песчаной подушки под фундамент',
        'Послойная отсыпка и вибротрамбование песка средней крупности, толщина слоя 30 см.',
        v_obj3_id, v_exec2_id, v_manager_id, 'new', now() - INTERVAL '1 day'
    ) ON CONFLICT (id) DO NOTHING;

    ALTER TABLE public.tasks ENABLE TRIGGER trg_task_created;
    ALTER TABLE public.tasks ENABLE TRIGGER trg_validate_task_update;

    -- 5. Заполнение правдоподобной истории для созданных задач
    -- История Задачи 1 (Новая)
    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES (v_task1_id, v_manager_id, NULL, 'new', 'Задача создана', now() - INTERVAL '3 days')
    ON CONFLICT DO NOTHING;

    -- История Задачи 2 (В работе)
    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES 
        (v_task2_id, v_manager_id, NULL, 'new', 'Задача создана', now() - INTERVAL '2 days'),
        (v_task2_id, v_exec1_id, 'new', 'in_progress', 'Приступил к сборке щита', now() - INTERVAL '1 day 18 hours')
    ON CONFLICT DO NOTHING;

    -- История Задачи 3 (На проверке)
    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES 
        (v_task3_id, v_manager_id, NULL, 'new', 'Задача создана', now() - INTERVAL '4 days'),
        (v_task3_id, v_exec1_id, 'new', 'in_progress', 'Начал монтаж и проверку шлейфов', now() - INTERVAL '3 days 20 hours'),
        (v_task3_id, v_exec1_id, 'in_progress', 'review', 'Все датчики протестированы, акты подписаны со стороны бригады', now() - INTERVAL '5 hours')
    ON CONFLICT DO NOTHING;

    -- История Задачи 4 (На доработке)
    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES 
        (v_task4_id, v_manager_id, NULL, 'new', 'Задача создана', now() - INTERVAL '5 days'),
        (v_task4_id, v_exec2_id, 'new', 'in_progress', 'Бригада вышла на монтаж утеплителя', now() - INTERVAL '4 days 12 hours'),
        (v_task4_id, v_exec2_id, 'in_progress', 'review', 'Фасад утеплен, готов к сдаче', now() - INTERVAL '2 days'),
        (v_task4_id, v_manager_id, 'review', 'rework', 'Обнаружены зазоры между плитами по оси 3-5, исправить гидроизоляцию мембраны', now() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

    -- История Задачи 5 (Принята)
    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES 
        (v_task5_id, v_manager_id, NULL, 'new', 'Задача создана', now() - INTERVAL '6 days'),
        (v_task5_id, v_exec2_id, 'new', 'in_progress', 'Завезли раствор и технику', now() - INTERVAL '5 days 10 hours'),
        (v_task5_id, v_exec2_id, 'in_progress', 'review', 'Стяжка высохла, перепады проверены уровнем — в норме', now() - INTERVAL '2 days 14 hours'),
        (v_task5_id, v_manager_id, 'review', 'accepted', 'Принято без замечаний, геометрия и прочность соответствуют СП', now() - INTERVAL '1 day 8 hours')
    ON CONFLICT DO NOTHING;

    -- История Задачи 6 (Новая)
    INSERT INTO public.task_history (task_id, actor_id, from_status, to_status, comment, created_at)
    VALUES (v_task6_id, v_manager_id, NULL, 'new', 'Задача создана', now() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

END $$;
