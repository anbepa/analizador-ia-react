-- Script de migración para actualizar la estructura de la base de datos
-- Ejecuta este script en tu cliente SQL de Supabase o PostgreSQL

-- 1. Agregar nuevas columnas a la tabla 'reports'
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS id_caso TEXT,
ADD COLUMN IF NOT EXISTS precondiciones TEXT;

-- 2. (Opcional) Si deseas limpiar datos antiguos o establecer valores por defecto
-- UPDATE reports SET id_caso = 'CP-' || id WHERE id_caso IS NULL;
-- UPDATE reports SET precondiciones = 'N/A' WHERE precondiciones IS NULL;

-- 3. Verificar que la tabla report_steps tenga las columnas necesarias (ya deberían existir)
-- descripcion_accion_observada (Paso a Paso)
-- resultado_esperado_paso (Resultado Esperado)
