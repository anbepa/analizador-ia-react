# Solución: Frames de Video No se Muestran en ReportDisplay

## Problema Identificado

Los frames extraídos del video se estaban añadiendo correctamente a `compressedImages` en `AppContext.jsx` con las propiedades `fromVideoFrame: true` y `stepNumber`, **pero estas propiedades se perdían al guardar en la base de datos** porque las columnas no existían en la tabla `report_images`.

## Logs que revelaron el problema

```
[REPORT-DISPLAY] Image 0: {fromVideoFrame: undefined, stepNumber: undefined, ...}
[REPORT-DISPLAY] Image 1: {fromVideoFrame: undefined, stepNumber: undefined, ...}
```

Todos los frames tenían `fromVideoFrame: undefined` porque la columna no existía en Supabase.

## Solución Implementada

### 1. **Actualización de `imageService.js`**

- ✅ Guardar `fromVideoFrame` y `stepNumber` al insertar imágenes (líneas 212-213)
- ✅ Cargar `fromVideoFrame` y `stepNumber` al leer imágenes (líneas 304-305)
- ✅ Incluir columnas en la query de `loadImagesForReports` (línea 325)

### 2. **Actualización de `databaseService.js`**

- ✅ Mapear `fromVideoFrame` y `stepNumber` al cargar reportes permanentes (líneas 588-589)

### 3. **Migración SQL para Supabase**

Se creó el archivo `migrations/add_video_frame_columns.sql` con el SQL necesario.

## Pasos para Completar la Solución

### Paso 1: Ejecutar la Migración SQL en Supabase

1. Abre el **SQL Editor** en tu dashboard de Supabase: https://supabase.com/dashboard/project/_/sql
2. Ejecuta el siguiente SQL:

```sql
-- Add columns for video frame metadata
ALTER TABLE report_images 
ADD COLUMN IF NOT EXISTS from_video_frame BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS step_number INTEGER DEFAULT NULL;

-- Add index for faster queries on video frames
CREATE INDEX IF NOT EXISTS idx_report_images_video_frames 
ON report_images(report_id, from_video_frame, step_number) 
WHERE from_video_frame = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN report_images.from_video_frame IS 'Indicates if this image was extracted from a video';
COMMENT ON COLUMN report_images.step_number IS 'The step number this video frame corresponds to';
```

3. Haz clic en **Run** para ejecutar la migración.

### Paso 2: Probar la Funcionalidad

1. Recarga la aplicación React (ya está corriendo)
2. Sube un nuevo video y analízalo
3. Verifica los logs en la consola:
   - Deberías ver `fromVideoFrame: true` y `stepNumber: 1, 2, 3` en los logs de `[REPORT-DISPLAY]`
   - Los frames deberían aparecer debajo de cada paso con el badge "Frame del Video"

### Paso 3: Verificar Visualmente

Los frames ahora deben aparecer así:

```
Paso 1
┌─────────────────────────────┐
│ Evidencia Entrada           │
│ [imagen tradicional]        │
└─────────────────────────────┘
┌─────────────────────────────┐
│ Evidencia Salida            │
│ [imagen tradicional]        │
└─────────────────────────────┘
┌─────────────────────────────┐
│ 🎥 Frame del Video (00:01)  │
│ [frame extraído]            │
└─────────────────────────────┘
```

## Archivos Modificados

- ✅ `src/lib/imageService.js` - Guardar y cargar metadata de frames
- ✅ `src/lib/databaseService.js` - Mapear metadata al cargar reportes
- ✅ `src/components/ReportDisplay.jsx` - Logging detallado (temporal)
- ✅ `migrations/add_video_frame_columns.sql` - SQL para Supabase

## Próximos Pasos

1. **Ejecuta el SQL en Supabase** (Paso 1 arriba)
2. **Prueba con un nuevo video**
3. **Confirma que los frames aparecen correctamente**
4. **OPCIONAL: Elimina los console.log de depuración** en `ReportDisplay.jsx` (líneas 247-269)

---

**Nota**: Los frames de videos analizados **antes** de esta corrección no tendrán `fromVideoFrame` ni `stepNumber` en la base de datos, por lo que no se mostrarán. Solo funcionará con nuevos análisis de video.
