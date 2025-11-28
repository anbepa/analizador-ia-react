-- Script de migración para nueva estructura de casos de prueba
-- Ejecuta este script en tu cliente SQL de Supabase o PostgreSQL

-- 1. Agregar nuevas columnas a la tabla 'reports'
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS id_caso TEXT,
ADD COLUMN IF NOT EXISTS escenario_prueba TEXT,
ADD COLUMN IF NOT EXISTS precondiciones TEXT,
ADD COLUMN IF NOT EXISTS resultado_esperado TEXT,
ADD COLUMN IF NOT EXISTS resultado_obtenido TEXT,
ADD COLUMN IF NOT EXISTS historia_usuario TEXT,
ADD COLUMN IF NOT EXISTS set_escenarios TEXT,
ADD COLUMN IF NOT EXISTS fecha_ejecucion DATE,
ADD COLUMN IF NOT EXISTS estado_general TEXT;

-- 2. Renombrar columnas antiguas (opcional, para mantener compatibilidad)
-- Si prefieres mantener las columnas antiguas, puedes comentar estas líneas
-- ALTER TABLE reports RENAME COLUMN nombre_del_escenario TO escenario_prueba;
-- ALTER TABLE reports RENAME COLUMN resultado_esperado_general_flujo TO resultado_esperado;
-- ALTER TABLE reports RENAME COLUMN conclusion_general_flujo TO resultado_obtenido;

-- 3. Modificar la tabla report_steps para simplificar
-- Los pasos ahora solo necesitan: numero_paso y descripcion
-- Las otras columnas se mantienen por compatibilidad pero pueden ser NULL

-- 4. Comentarios para documentación
COMMENT ON COLUMN reports.id_caso IS 'Identificador único del caso de prueba (ej: GB05108_CP1)';
COMMENT ON COLUMN reports.escenario_prueba IS 'Título descriptivo del escenario de prueba';
COMMENT ON COLUMN reports.precondiciones IS 'Condiciones previas necesarias para ejecutar el caso';
COMMENT ON COLUMN reports.resultado_esperado IS 'Resultado esperado general del caso completo';
COMMENT ON COLUMN reports.resultado_obtenido IS 'Resultado obtenido tras la ejecución del caso';
COMMENT ON COLUMN reports.historia_usuario IS 'Historia de usuario asociada (ej: GB05108)';
COMMENT ON COLUMN reports.set_escenarios IS 'Set o grupo de escenarios al que pertenece';
COMMENT ON COLUMN reports.fecha_ejecucion IS 'Fecha en que se ejecutó el caso de prueba';
COMMENT ON COLUMN reports.estado_general IS 'Estado general del caso: Pendiente, Exitoso, Fallido';
