-- MIGRACIÓN DEFINITIVA V3: Idempotente y Robusta
-- Ejecutar todo el bloque en una sola transacción

BEGIN;

--------------------------------------------------------------------------------
-- 1. ELIMINAR RESTRICCIONES CONFLICTIVAS (Limpieza Previa)
--------------------------------------------------------------------------------
ALTER TABLE IF EXISTS reports DROP CONSTRAINT IF EXISTS reports_user_story_id_fkey;
ALTER TABLE IF EXISTS report_steps DROP CONSTRAINT IF EXISTS report_steps_report_id_fkey;
ALTER TABLE IF EXISTS test_scenarios DROP CONSTRAINT IF EXISTS reports_user_story_id_fkey;
ALTER TABLE IF EXISTS test_scenarios DROP CONSTRAINT IF EXISTS test_scenarios_user_story_id_fkey;
ALTER TABLE IF EXISTS test_scenario_steps DROP CONSTRAINT IF EXISTS test_scenario_steps_scenario_id_fkey;

--------------------------------------------------------------------------------
-- 2. RENOMBRADO DE TABLAS (Solo si no se han renombrado)
--------------------------------------------------------------------------------
-- Renombrar user_stories a user_stories_old
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_stories') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_stories_old') THEN
        ALTER TABLE user_stories RENAME TO user_stories_old;
    END IF;
END $$;

-- Renombrar reports a test_scenarios
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
        ALTER TABLE reports RENAME TO test_scenarios;
    END IF;
END $$;

-- Renombrar report_steps a test_scenario_steps
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'report_steps') THEN
        ALTER TABLE report_steps RENAME TO test_scenario_steps;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- 3. CREACIÓN DE NUEVA TABLA USER_STORIES (INTEGER)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_stories (
    id SERIAL PRIMARY KEY,
    numero INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

--------------------------------------------------------------------------------
-- 4. MIGRACIÓN DE DATOS DE HU
--------------------------------------------------------------------------------
INSERT INTO user_stories (numero, title, created_at, updated_at)
SELECT 
    CAST(REGEXP_REPLACE(code, '[^0-9]', '', 'g') AS INTEGER),
    title,
    created_at,
    updated_at
FROM user_stories_old
WHERE code ~ '^HU-[0-9]+$'
ON CONFLICT (numero) DO NOTHING;

--------------------------------------------------------------------------------
-- 5. ACTUALIZACIÓN DE TEST_SCENARIOS (CAMBIO DE TIPO DE COLUMNA)
--------------------------------------------------------------------------------
-- Verificar si ya se hizo el cambio de columna
DO $$
BEGIN
    -- Si existe user_story_id y es UUID, necesitamos migrar
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_scenarios' AND column_name = 'user_story_id' AND data_type = 'uuid') THEN
        
        -- Añadir columna temporal
        ALTER TABLE test_scenarios ADD COLUMN IF NOT EXISTS user_story_id_new INTEGER;

        -- Migrar datos con casting explícito
        UPDATE test_scenarios ts
        SET user_story_id_new = us.id
        FROM user_stories_old uso
        JOIN user_stories us ON CAST(REGEXP_REPLACE(uso.code, '[^0-9]', '', 'g') AS INTEGER) = us.numero
        WHERE ts.user_story_id::text = uso.id::text;

        -- Eliminar vieja y renombrar nueva
        ALTER TABLE test_scenarios DROP COLUMN user_story_id;
        ALTER TABLE test_scenarios RENAME COLUMN user_story_id_new TO user_story_id;
    END IF;
END $$;

-- Asegurar FK (borrar si existe y crear de nuevo)
ALTER TABLE test_scenarios DROP CONSTRAINT IF EXISTS test_scenarios_user_story_id_fkey;
ALTER TABLE test_scenarios 
    ADD CONSTRAINT test_scenarios_user_story_id_fkey 
    FOREIGN KEY (user_story_id) REFERENCES user_stories(id) ON DELETE SET NULL;

--------------------------------------------------------------------------------
-- 6. ACTUALIZACIÓN DE TEST_SCENARIO_STEPS
--------------------------------------------------------------------------------
-- Renombrar columna report_id a scenario_id si aún se llama report_id
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_scenario_steps' AND column_name = 'report_id') THEN
        ALTER TABLE test_scenario_steps RENAME COLUMN report_id TO scenario_id;
    END IF;
END $$;

-- Actualizar FK de steps (borrar si existe y crear de nuevo)
ALTER TABLE test_scenario_steps DROP CONSTRAINT IF EXISTS report_steps_report_id_fkey;
ALTER TABLE test_scenario_steps DROP CONSTRAINT IF EXISTS test_scenario_steps_scenario_id_fkey;

ALTER TABLE test_scenario_steps 
    ADD CONSTRAINT test_scenario_steps_scenario_id_fkey 
    FOREIGN KEY (scenario_id) REFERENCES test_scenarios(id) ON DELETE CASCADE;

--------------------------------------------------------------------------------
-- 7. COMENTARIOS
--------------------------------------------------------------------------------
COMMENT ON TABLE user_stories IS 'Historias de Usuario - Identificadas por número único y título';
COMMENT ON TABLE test_scenarios IS 'Escenarios de Prueba (antes Reportes)';

COMMIT;
