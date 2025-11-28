# Eliminación de Funcionalidad de Capturas de Pantalla de Videos

## Resumen
Este documento detalla los cambios necesarios para eliminar la funcionalidad de extracción automática de capturas de pantalla (frames) de videos en los reportes, sin afectar la reproducción de videos.

## Objetivo
- ✅ Mantener la capacidad de cargar y reproducir videos en los reportes
- ❌ Eliminar la extracción automática de frames/capturas de pantalla de los videos
- ❌ Eliminar las referencias a timestamps de video en los prompts de IA
- ❌ Eliminar la visualización de frames extraídos en los reportes

## Archivos a Modificar

### 1. **src/lib/prompts.js**
**Cambios:**
- Eliminar las líneas 14-37 que instruyen a la IA a incluir `video_timestamp`
- Eliminar la línea 37 que menciona la importancia de los timestamps para capturas automáticas

**Sección a eliminar:**
```javascript
// Líneas 14-37 - Eliminar completamente
**⚠️ CRÍTICO - TIMESTAMPS PARA VIDEOS (OBLIGATORIO):**
Si la evidencia es un VIDEO (no una imagen estática), DEBES incluir OBLIGATORIAMENTE el campo "video_timestamp" en CADA paso del análisis.
...
**IMPORTANTE:** Si NO incluyes "video_timestamp" en cada paso cuando hay un video, el sistema NO podrá generar capturas de pantalla automáticas y el análisis estará INCOMPLETO.
```

### 2. **src/context/AppContext.jsx**
**Cambios:**
- Eliminar las líneas 278-387 que manejan la extracción de frames de video
- Eliminar la importación del servicio de extracción de frames (si existe)

**Secciones a eliminar:**
```javascript
// Líneas 278-387 - Eliminar todo el bloque de extracción de frames
// Check if we have a video and timestamps
const videoFile = compressedImages.find(f => f.isVideo);
const hasTimestamps = newReportData.Pasos_Analizados.some(paso => paso.video_timestamp);
...
// Todo el código relacionado con processVideoSteps y requestFrameExtraction
```

### 3. **src/components/ReportDisplay.jsx**
**Cambios:**
- Eliminar las líneas 242-270 que buscan y procesan frames de video
- Eliminar las líneas 278-282 que muestran el timestamp en la descripción del paso
- Eliminar las líneas 330-345 que renderizan las capturas de frames de video
- Actualizar la condición de la línea 303 para eliminar la referencia a `stepFrame`

**Secciones a modificar/eliminar:**
```javascript
// Líneas 242-270 - Eliminar búsqueda de frames
const stepFrame = activeReportImages?.find(img =>
    img.fromVideoFrame && img.stepNumber === paso.numero_paso
);
// ... todo el código de debug

// Líneas 278-282 - Eliminar badge de timestamp
{paso.video_timestamp && (
    <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
        ⏱ {paso.video_timestamp}
    </span>
)}

// Línea 303 - Cambiar de:
{(imgIndexEntrada >= 0 || imgIndexSalida >= 0 || stepFrame) && (
// A:
{(imgIndexEntrada >= 0 || imgIndexSalida >= 0) && (

// Líneas 330-345 - Eliminar renderizado de frames
{stepFrame && (
    <div className="flex-1 min-w-[200px] max-w-[400px]">
        ...
    </div>
)}
```

### 4. **src/lib/frameExtractionService.js**
**Acción:** 
- **ELIMINAR ARCHIVO COMPLETO** - Ya no se necesita este servicio

### 5. **local-api-server.js**
**Cambios:**
- Eliminar las líneas 67-83 (funciones helper para frames)
- Eliminar las líneas 85-221 (endpoint `/api/extract-frames`)
- Eliminar la línea 322 que registra el endpoint

**Secciones a eliminar:**
```javascript
// Líneas 67-83 - Eliminar helpers
async function downloadFile(url, destPath) { ... }
function timestampToSeconds(timestamp) { ... }

// Líneas 85-221 - Eliminar endpoint completo
app.post('/api/extract-frames', async (req, res) => { ... });

// Línea 322 - Eliminar log
console.log(`[ENDPOINT] http://localhost:${PORT}/api/extract-frames`)
```

## Funcionalidad que SE MANTIENE

✅ **Reproducción de videos:** Los videos seguirán siendo cargables y reproducibles en la sección de evidencias
✅ **Análisis de IA:** La IA seguirá analizando el contenido del video completo
✅ **Imágenes tradicionales:** Las capturas de pantalla manuales (imágenes) seguirán funcionando normalmente
✅ **Reportes:** Los reportes seguirán generándose con toda la información excepto los frames extraídos

## Beneficios de la Eliminación

1. **Rendimiento:** Reducción del tiempo de procesamiento al no extraer frames
2. **Simplicidad:** Código más limpio y mantenible
3. **Almacenamiento:** Menos datos almacenados (no se guardan frames extraídos)
4. **Claridad:** Los reportes se enfocan en el análisis de IA sin capturas intermedias

## Verificación Post-Cambios

Después de implementar los cambios, verificar:

1. ✅ Los videos se cargan correctamente
2. ✅ Los videos se reproducen en la sección de evidencias
3. ✅ La IA analiza el video sin errores
4. ✅ Los reportes se generan sin referencias a timestamps o frames
5. ✅ No hay errores en la consola relacionados con extracción de frames
6. ✅ El servidor no intenta llamar al endpoint `/api/extract-frames`

## Notas Adicionales

- Los campos `video_timestamp`, `frame_url`, `auto_timestamp` en los pasos del reporte ya no se generarán
- La base de datos puede mantener estos campos para compatibilidad con reportes antiguos, pero no se usarán
- Si existen reportes antiguos con frames extraídos, seguirán visualizándose correctamente
