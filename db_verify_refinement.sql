-- Script de verificación de estructura de BD para refinamiento
-- Ejecuta esto en Supabase SQL Editor para verificar que todo esté correcto

-- 1. Verificar que la tabla test_scenario_steps tiene la columna imagen_referencia
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'test_scenario_steps' 
  AND column_name IN ('imagen_referencia', 'imagen_referencia_entrada', 'imagen_referencia_salida', 'descripcion_accion_observada');

-- 2. Verificar que NO existan las columnas antiguas
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'test_scenario_steps' 
  AND column_name IN ('dato_de_entrada_paso', 'resultado_esperado_paso', 'resultado_obtenido_paso_y_estado');

-- 3. Contar reportes por user_story_id
SELECT user_story_id, COUNT(*) as total_reportes
FROM test_scenarios
WHERE user_story_id IS NOT NULL
GROUP BY user_story_id
ORDER BY total_reportes DESC;

-- 4. Ver últimos 5 reportes creados/actualizados
SELECT id, escenario_prueba, user_story_id, created_at, updated_at
FROM test_scenarios
ORDER BY updated_at DESC
LIMIT 5;

-- 5. Ver pasos del último reporte actualizado
SELECT ts.id, ts.escenario_prueba, tss.numero_paso, tss.descripcion_accion_observada, tss.imagen_referencia
FROM test_scenarios ts
LEFT JOIN test_scenario_steps tss ON ts.id = tss.scenario_id
WHERE ts.id = (SELECT id FROM test_scenarios ORDER BY updated_at DESC LIMIT 1)
ORDER BY tss.numero_paso;
