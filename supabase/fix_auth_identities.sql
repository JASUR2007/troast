-- =====================================================================
-- ИСПРАВЛЕНИЕ ОШИБКИ 500 ПРИ ВХОДЕ В SUPABASE AUTH (ЗАПОЛНЕНИЕ IDENTITIES)
-- =====================================================================
-- Сервер авторизации Supabase (GoTrue) требует запись в auth.identities
-- при входе по паролю. Данный скрипт автоматически связывает всех созданных
-- пользователей с провайдером email.

DO $$
DECLARE
    r RECORD;
    has_provider_id BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'provider_id'
    ) INTO has_provider_id;

    FOR r IN (
        SELECT id, email FROM auth.users 
        WHERE id NOT IN (SELECT user_id FROM auth.identities)
    ) LOOP
        IF has_provider_id THEN
            EXECUTE format(
                'INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) ' ||
                'VALUES (gen_random_uuid(), %L, %L::uuid, %L::jsonb, ''email'', now(), now(), now()) ' ||
                'ON CONFLICT DO NOTHING',
                r.id::text,
                r.id::text,
                json_build_object('sub', r.id::text, 'email', r.email)::text
            );
        ELSE
            EXECUTE format(
                'INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) ' ||
                'VALUES (gen_random_uuid(), %L::uuid, %L::jsonb, ''email'', now(), now(), now()) ' ||
                'ON CONFLICT DO NOTHING',
                r.id::text,
                json_build_object('sub', r.id::text, 'email', r.email)::text
            );
        END IF;
    END LOOP;
END $$;
