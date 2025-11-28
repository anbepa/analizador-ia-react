# Resumen de Simplificación de Estructura

## Fecha: 2025-11-28

## Objetivo
Simplificar la estructura de escenarios de prueba eliminando campos innecesarios por paso y manteniendo solo un "Resultado Obtenido" general para todo el escenario.

---

## Cambios en Base de Datos

### Tabla `test_scenario_steps` - COLUMNAS A ELIMINAR:
- ❌ `dato_de_entrada_paso` - Ya no se usa
- ❌ `resultado_esperado_paso` - Ya no se usa
- ❌ `resultado_obtenido_paso_y_estado` - Ya no se usa
- ❌ `imagen_referencia_salida` - Ya no se usa
- ❌ `elemento_clave_y_ubicacion_aproximada` - Ya no se usa

### Tabla `test_scenario_steps` - COLUMNAS A RENOMBRAR:
- 🔄 `imagen_referencia_entrada` → `imagen_referencia` (más simple)

### Tabla `test_scenario_steps` - ESTRUCTURA FINAL:
✅ Columnas que SÍ se mantienen:
- `id` (UUID, PK)
- `scenario_id` (UUID, FK a test_scenarios)
- `numero_paso` (INTEGER)
- `descripcion_accion_observada` (TEXT)
- `imagen_referencia` (TEXT) - renombrada
- `created_at` (TIMESTAMP)

### Tabla `test_scenarios` - SIN CAMBIOS
Esta tabla ya tiene la estructura correcta con `resultado_obtenido` general.

---

## Cambios en Código

### ✅ Archivos Modificados:

1. **src/components/ReportDisplay.jsx**
   - Eliminadas columnas de tabla: "Dato de Entrada", "Resultado Esperado", "Resultado Obtenido" por paso
   - Agregada sección "Resultado Obtenido" general después de la tabla
   - Tabla simplificada: #, Descripción, Evidencia

2. **src/lib/prompts.js**
   - Simplificado formato JSON de respuesta de Gemini
   - Eliminadas referencias a campos por paso
   - Estructura de pasos ahora solo requiere: `numero_paso`, `descripcion`, `imagen_referencia`

3. **src/context/AppContext.jsx**
   - Eliminado código complejo de extracción de campos por paso
   - Mapeo simplificado de pasos

---

## Cómo Aplicar la Migración

### Opción 1: Usando Supabase Dashboard
1. Ir a SQL Editor en Supabase
2. Copiar y pegar el contenido de `db_migration_simplify_steps.sql`
3. Ejecutar el script

### Opción 2: Usando psql
```bash
psql -h <host> -U <user> -d <database> -f db_migration_simplify_steps.sql
```

---

## Verificación Post-Migración

Ejecutar esta query para verificar la estructura final:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'test_scenario_steps'
ORDER BY ordinal_position;
```

**Resultado esperado:**
- id (uuid)
- scenario_id (uuid)
- numero_paso (integer)
- descripcion_accion_observada (text)
- imagen_referencia (text)
- created_at (timestamp with time zone)

---

## Beneficios de la Simplificación

1. ✅ **Menos complejidad**: Estructura más simple y fácil de mantener
2. ✅ **Mejor compatibilidad con Gemini**: Menos campos = menos errores de mapeo
3. ✅ **UI más limpia**: Tabla de pasos más legible
4. ✅ **Resultado general más útil**: Un solo "Resultado Obtenido" para todo el escenario es más práctico
5. ✅ **Menos datos redundantes**: Eliminamos información que rara vez se usaba

---

## Notas Importantes

⚠️ **BACKUP**: Antes de ejecutar la migración, haz un backup de tu base de datos.

⚠️ **Datos existentes**: Los datos en las columnas eliminadas se perderán. Si necesitas conservarlos, crea una tabla de respaldo primero:

```sql
-- Crear respaldo de datos antiguos (opcional)
CREATE TABLE test_scenario_steps_backup AS 
SELECT * FROM test_scenario_steps;
```

✅ **Compatibilidad**: El código ya está actualizado para trabajar con la nueva estructura simplificada.
