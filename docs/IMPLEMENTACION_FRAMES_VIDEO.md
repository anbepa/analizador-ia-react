# Implementación de Extracción Automática de Frames de Video

## Resumen

Se ha implementado exitosamente la **Opción 3 (Híbrida)** para la extracción automática de capturas de pantalla de videos durante el análisis con IA.

## Arquitectura

### Flujo de Trabajo

1. **Usuario sube un video** → El video se almacena en Supabase Storage
2. **Gemini analiza el video** → Genera pasos con timestamps precisos (formato `MM:SS` o `HH:MM:SS`)
3. **Sistema extrae frames** → Descarga el video, usa FFmpeg para extraer frames en los timestamps
4. **Frames se almacenan** → Los frames se convierten a base64 y se guardan en la base de datos
5. **Reporte muestra frames** → Cada paso del reporte muestra su frame correspondiente

### Componentes Implementados

#### 1. **Backend (`local-api-server.js`)**
- **Endpoint `/api/extract-frames`**: Recibe URL del video y timestamps
- **Proceso**:
  - Descarga el video desde Supabase
  - Usa FFmpeg para extraer frames en timestamps específicos
  - Convierte frames a base64 (JPEG, 1920x1080)
  - Retorna array de frames con URLs base64
  - Limpia archivos temporales

#### 2. **Servicio de Extracción (`frameExtractionService.js`)**
- **`timestampToSeconds()`**: Convierte timestamps a segundos
- **`requestFrameExtraction()`**: Llama al endpoint del backend
- **`processVideoSteps()`**: Procesa pasos del reporte y asocia frames

#### 3. **Contexto de Aplicación (`AppContext.jsx`)**
- **Integración en `handleAnalysis()`**:
  - Detecta si hay video con timestamps
  - Llama a `processVideoSteps()` después del análisis de Gemini
  - Convierte frames a objetos de imagen para almacenamiento
  - Agrega frames al array de `imageFiles`

#### 4. **Visualización (`ReportDisplay.jsx`)**
- **Muestra timestamp** en la descripción del paso (badge con ⏱)
- **Renderiza frame del video** con borde destacado y etiqueta especial
- **Mantiene evidencias originales** (entrada/salida) si existen

#### 5. **Prompts (`prompts.js`)**
- **Instrucción adicional** para que Gemini incluya `video_timestamp` en cada paso
- **Formato requerido**: `"video_timestamp": "00:15"` (MM:SS o HH:MM:SS)

## Dependencias Instaladas

```bash
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
```

- **fluent-ffmpeg**: Wrapper de Node.js para FFmpeg
- **@ffmpeg-installer/ffmpeg**: Binario de FFmpeg multiplataforma

## Estructura de Datos

### Paso con Timestamp (Gemini Response)
```json
{
  "numero_paso": 1,
  "descripcion_accion_observada": "Usuario hace clic en el botón de login",
  "video_timestamp": "00:15",
  "imagen_referencia_entrada": "Evidencia 1",
  "imagen_referencia_salida": "Evidencia 1",
  ...
}
```

### Frame Extraído (Backend Response)
```json
{
  "stepNumber": 1,
  "timestamp": "00:15",
  "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### Imagen de Frame (Frontend Storage)
```javascript
{
  name: "frame_step_1.jpg",
  dataURL: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  type: "image/jpeg",
  isVideo: false,
  fromVideoFrame: true,
  stepNumber: 1
}
```

## Características

### ✅ Implementado

1. **Análisis de video nativo** con Gemini 2.0 Flash
2. **Timestamps precisos** generados por IA
3. **Extracción automática** de frames usando FFmpeg
4. **Almacenamiento en base de datos** como imágenes base64
5. **Visualización en reporte** con indicadores especiales
6. **Manejo de errores** robusto (continúa sin frames si falla)
7. **Limpieza de archivos temporales** automática
8. **Soporte multiplataforma** (FFmpeg instalado automáticamente)

### 🎨 UI/UX

- **Badge de timestamp** en la descripción del paso
- **Frame destacado** con borde azul y etiqueta "Frame del Video"
- **Icono de video** junto al timestamp
- **Click para ampliar** frames en nueva pestaña
- **Scroll horizontal** para múltiples evidencias

## Flujo de Datos Completo

```
┌─────────────┐
│   Usuario   │
│ Sube Video  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│    Supabase     │
│    Storage      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Gemini 2.0     │
│  Analiza Video  │
│  + Timestamps   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  AppContext     │
│  Detecta Video  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend API    │
│  /extract-frames│
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│    FFmpeg       │
│ Extrae Frames   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Base64 JPEG   │
│   → Frontend    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Supabase DB   │
│ report_images   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ ReportDisplay   │
│ Muestra Frames  │
└─────────────────┘
```

## Próximos Pasos (Opcional)

### Mejoras Futuras

1. **Optimización de almacenamiento**:
   - Subir frames a Supabase Storage en lugar de base64
   - Reducir tamaño de base de datos

2. **Control de calidad**:
   - Permitir al usuario ajustar resolución de frames
   - Opción para extraer frames adicionales manualmente

3. **Navegación de video**:
   - Click en frame para saltar a ese timestamp en el video
   - Sincronización entre video player y frames

4. **Batch processing**:
   - Extraer todos los frames en paralelo
   - Barra de progreso más detallada

5. **Edición de timestamps**:
   - Permitir al usuario ajustar timestamps en modo refinamiento
   - Re-extraer frames con nuevos timestamps

## Notas Técnicas

### Limitaciones

- **Tamaño de video**: Videos muy grandes pueden tardar en procesarse
- **Formato de video**: Funciona mejor con MP4, WebM, MOV
- **Precisión de timestamps**: Depende de la precisión de Gemini
- **Memoria**: Frames en base64 aumentan el tamaño de la base de datos

### Rendimiento

- **Tiempo de extracción**: ~1-2 segundos por frame
- **Tamaño de frame**: ~200-500KB en base64 (1920x1080 JPEG)
- **Procesamiento**: Secuencial (uno a la vez) para evitar sobrecarga

### Seguridad

- **Archivos temporales**: Se eliminan automáticamente después del procesamiento
- **Validación**: Se valida URL del video antes de descargar
- **Límites**: No hay límite de frames, pero se recomienda <20 por video

## Conclusión

La implementación permite un análisis de video completamente automatizado con evidencia visual precisa para cada paso. El sistema es robusto, escalable y proporciona una excelente experiencia de usuario.
