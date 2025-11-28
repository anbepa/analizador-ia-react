# HU-002: Análisis de Video para Generación de Reportes

## Descripción
Como Analista de QA, quiero poder subir un archivo de video que capture un flujo de prueba completo, para que el sistema procese automáticamente el video, extraiga los pasos relevantes y genere un reporte detallado con persistencia en la base de datos, similar a como funciona actualmente con imágenes estáticas.

## Criterios de Aceptación

### 1. Carga de Video
- [ ] El sistema debe permitir subir archivos de video en formatos comunes (MP4, WebM, MOV).
- [ ] Debe existir una opción clara en la interfaz para "Subir Video" o arrastrar un archivo de video.
- [ ] **Validación**: El sistema debe validar que el archivo no exceda un tamaño razonable (ej. 50MB) para la versión inicial.

### 2. Persistencia (Supabase Storage)
- [ ] **Almacenamiento**: El video original debe subirse automáticamente a un bucket de Supabase Storage (ej. `evidence-videos`).
- [ ] **Referencia**: La base de datos debe guardar la URL pública o firmada del video asociado al reporte.
- [ ] No se deben guardar videos en base64 en la base de datos para evitar problemas de rendimiento.

### 3. Procesamiento y Análisis (Nativo con Gemini)
- [ ] **Análisis Multimodal**: El sistema debe enviar el video directamente al modelo `gemini-2.0-flash` (o compatible) para aprovechar su capacidad nativa de "ver" y "escuchar".
- [ ] **Flujo de Backend**:
    1. El frontend sube el video a Supabase.
    2. El frontend envía la URL (o el archivo) al servidor local.
    3. El servidor local sube el video temporalmente a la **Google AI File API**.
    4. Gemini analiza el video desde la File API.
- [ ] **Prompt**: El prompt debe ajustarse para pedirle a la IA que identifique los pasos clave, tiempos y acciones realizadas en el video.

### 4. Generación de Reporte
- [ ] El reporte generado debe listar los pasos identificados cronológicamente.
- [ ] **Capturas (Opcional)**: Idealmente, si la API lo permite, extraer o solicitar timestamps de los momentos clave.
- [ ] El reporte final en la UI debe permitir reproducir el video subido como evidencia principal.

### 5. Interfaz de Usuario
- [ ] Barra de progreso real durante la subida del video a Supabase.
- [ ] Indicador de estado: "Subiendo video...", "Analizando con IA...", "Generando reporte".
- [ ] Reproductor de video integrado en la vista del reporte final.

## Notas Técnicas
- **Arquitectura**: Frontend -> Supabase Storage (Persistencia) -> Local Server -> Google AI File API (Análisis Temporal) -> Gemini.
- **Ventajas**: Este enfoque permite un análisis mucho más profundo (detectando movimiento, velocidad, errores visuales transitorios) que la extracción de frames estáticos.
- **Requisito**: Se requiere configurar un bucket público o privado en Supabase y actualizar el `local-api-server.js` para manejar `GoogleAIFileManager`.
