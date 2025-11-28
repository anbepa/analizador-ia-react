-- Migración Corregida: Solución de Incompatibilidad de Tipos (UUID vs Integer)
-- Este script maneja la conversión de la columna user_story_id de UUID a Integer

BEGIN;

-- 1. Renombrar tablas de forma segura (si no se han renombrado ya)
DO $$
BEGIN
    -- Renombrar user_stories a user_stories_old si existe la tabla original y no la backup
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_stories') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_stories_old') THEN
        ALTER TABLE user_stories RENAME TO user_stories_old;
    END IF;

    -- Renombrar reports a test_scenarios
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
        ALTER TABLE reports RENAME TO test_scenarios;
    END IF;

    -- Renombrar report_steps a test_scenario_steps
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'report_steps') THEN
        ALTER TABLE report_steps RENAME TO test_scenario_steps;
    END IF;
END $$;

-- 2. Crear nueva tabla user_stories con ID entero
CREATE TABLE IF NOT EXISTS user_stories (
    id SERIAL PRIMARY KEY,
    numero INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Migrar datos de user_stories_old a user_stories
-- Extraemos el número del código (ej: HU-123 -> 123)
INSERT INTO user_stories (numero, title, created_at, updated_at)
SELECT 
    CAST(REGEXP_REPLACE(code, '[^0-9]', '', 'g') AS INTEGER),
    title,
    created_at,
    updated_at
FROM user_stories_old
WHERE code ~ '^HU-[0-9]+$'
ON CONFLICT (numero) DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_stories_numero ON user_stories(numero);

-- 4. Actualizar test_scenarios para cambiar user_story_id de UUID a INTEGER
-- Paso 4.1: Agregar columna temporal
ALTER TABLE test_scenarios ADD COLUMN IF NOT EXISTS user_story_id_new INTEGER;

-- Paso 4.2: Llenar la nueva columna mapeando UUID viejo -> HU Numero -> Nuevo ID
-- Solo si existe user_stories_old para hacer el join
UPDATE test_scenarios ts
SET user_story_id_new = us.id
FROM user_stories_old uso
JOIN user_stories us ON CAST(REGEXP_REPLACE(uso.code, '[^0-9]', '', 'g') AS INTEGER) = us.numero
WHERE ts.user_story_id::text = uso.id::text; -- Cast a text por seguridad si hay mezcla de tipos

-- Paso 4.3: Eliminar constraint vieja si existe
ALTER TABLE test_scenarios DROP CONSTRAINT IF EXISTS reports_user_story_id_fkey;
ALTER TABLE test_scenarios DROP CONSTRAINT IF EXISTS test_scenarios_user_story_id_fkey; -- Por si se creó parcialmente

-- Paso 4.4: Eliminar columna vieja UUID y renombrar la nueva INTEGER
ALTER TABLE test_scenarios DROP COLUMN IF EXISTS user_story_id;
ALTER TABLE test_scenarios RENAME COLUMN user_story_id_new TO user_story_id;

-- 5. Crear la nueva Foreign Key con tipos compatibles (Integer -> Integer)
ALTER TABLE test_scenarios 
    ADD CONSTRAINT test_scenarios_user_story_id_fkey 
    FOREIGN KEY (user_story_id) REFERENCES user_stories(id) ON DELETE SET NULL;

-- 6. Ajustes en test_scenario_steps (renombrar report_id a scenario_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'test_scenario_steps' AND column_name = 'report_id') THEN
        ALTER TABLE test_scenario_steps RENAME COLUMN report_id TO scenario_id;
    END IF;
END $$;

-- Actualizar FK de steps
ALTER TABLE test_scenario_steps 
    DROP CONSTRAINT IF EXISTS report_steps_report_id_fkey,
    ADD CONSTRAINT test_scenario_steps_scenario_id_fkey 
    FOREIGN KEY (scenario_id) REFERENCES test_scenarios(id) ON DELETE CASCADE;

-- Comentarios
COMMENT ON TABLE user_stories IS 'Historias de Usuario - Identificadas por número único y título';
COMMENT ON TABLE test_scenarios IS 'Escenarios de Prueba (antes Reportes)';

COMMIT;
