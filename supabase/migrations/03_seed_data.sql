-- 03_seed_data.sql
-- Демонстрационные данные: 1 постановщик, 2 исполнителя, 3 объекта и задачи во всех статусах

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

    -- 1. Создание пользователей в auth.users
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

    -- 4. Задачи
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

    -- 5. История
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
