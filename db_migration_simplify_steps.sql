-- Migration: Simplificar estructura de test_scenario_steps
-- Fecha: 2025-11-28
-- Descripción: Eliminar columnas innecesarias de pasos (dato_de_entrada_paso, resultado_esperado_paso, resultado_obtenido_paso_y_estado)
-- ya que ahora solo usamos resultado_obtenido a nivel de escenario completo

-- PASO 0: Eliminar la vista que depende de las columnas
DROP VIEW IF EXISTS public.report_complete_view CASCADE;

-- PASO 1: Eliminar columnas de campos por paso que ya no se usan
ALTER TABLE public.test_scenario_steps 
DROP COLUMN IF EXISTS dato_de_entrada_paso CASCADE,
DROP COLUMN IF EXISTS resultado_esperado_paso CASCADE,
DROP COLUMN IF EXISTS resultado_obtenido_paso_y_estado CASCADE,
DROP COLUMN IF EXISTS imagen_referencia_salida CASCADE,
DROP COLUMN IF EXISTS elemento_clave_y_ubicacion_aproximada CASCADE;

-- PASO 2: Renombrar imagen_referencia_entrada a imagen_referencia (más simple)
ALTER TABLE public.test_scenario_steps 
RENAME COLUMN imagen_referencia_entrada TO imagen_referencia;

-- PASO 3: Recrear la vista con la estructura simplificada
CREATE OR REPLACE VIEW public.report_complete_view AS
SELECT 
    ts.id,
    ts.nombre_del_escenario,
    ts.id_caso,
    ts.escenario_prueba,
    ts.precondiciones,
    ts.resultado_esperado,
    ts.resultado_obtenido,
    ts.estado_general,
    ts.historia_usuario,
    ts.user_story_id,
    ts.created_at,
    ts.updated_at,
    -- Agregar información de pasos como JSON
    COALESCE(
        json_agg(
            json_build_object(
                'numero_paso', tss.numero_paso,
                'descripcion', tss.descripcion_accion_observada,
                'imagen_referencia', tss.imagen_referencia
            ) ORDER BY tss.numero_paso
        ) FILTER (WHERE tss.id IS NOT NULL),
        '[]'::json
    ) AS pasos,
    -- Agregar información de imágenes como JSON
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', ri.id,
                'file_name', ri.file_name,
                'image_url', ri.image_url,
                'image_order', ri.image_order
            ) ORDER BY ri.image_order
        )
        FROM public.report_images ri
        WHERE ri.report_id = ts.id),
        '[]'::json
    ) AS imagenes
FROM public.test_scenarios ts
LEFT JOIN public.test_scenario_steps tss ON ts.id = tss.scenario_id
GROUP BY ts.id;

-- PASO 4: Agregar comentarios para documentación
COMMENT ON TABLE public.test_scenario_steps IS 'Pasos individuales de cada escenario de prueba. Estructura simplificada: solo descripción y evidencia.';
COMMENT ON COLUMN public.test_scenario_steps.numero_paso IS 'Número secuencial del paso (1, 2, 3, etc.)';
COMMENT ON COLUMN public.test_scenario_steps.descripcion_accion_observada IS 'Descripción detallada de la acción observada en este paso';
COMMENT ON COLUMN public.test_scenario_steps.imagen_referencia IS 'Referencia a la evidencia (ej: "Evidencia 1", "Evidencia 2")';

COMMENT ON VIEW public.report_complete_view IS 'Vista completa de escenarios con pasos e imágenes agregados como JSON';

-- PASO 5: Verificar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'test_scenario_steps'
ORDER BY ordinal_position;
