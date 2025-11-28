-- Migración: Cambiar comportamiento de eliminación de HU a CASCADE
-- Cuando se elimina una Historia de Usuario, también se eliminan sus casos de prueba asociados
-- ADVERTENCIA: Esta acción es irreversible. Los casos de prueba se eliminarán permanentemente.

BEGIN;

-- 1. Eliminar la constraint existente
ALTER TABLE test_scenarios 
    DROP CONSTRAINT IF EXISTS test_scenarios_user_story_id_fkey;

-- 2. Crear la nueva constraint con ON DELETE CASCADE
ALTER TABLE test_scenarios 
    ADD CONSTRAINT test_scenarios_user_story_id_fkey 
    FOREIGN KEY (user_story_id) 
    REFERENCES user_stories(id) 
    ON DELETE CASCADE;

-- 3. Verificar que la constraint se creó correctamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'test_scenarios_user_story_id_fkey'
        AND table_name = 'test_scenarios'
    ) THEN
        RAISE NOTICE 'Constraint creada exitosamente: ON DELETE CASCADE';
    ELSE
        RAISE EXCEPTION 'Error: No se pudo crear la constraint';
    END IF;
END $$;

COMMIT;

-- Comentario de documentación
COMMENT ON CONSTRAINT test_scenarios_user_story_id_fkey ON test_scenarios IS 
'FK con CASCADE: Al eliminar una HU, se eliminan todos sus casos de prueba asociados';
