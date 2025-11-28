# Guía de Despliegue en Vercel

Este proyecto está configurado para desplegarse fácilmente en Vercel. Sigue estos pasos para configurar tu entorno de producción.

## 1. Preparación del Proyecto

El proyecto ya incluye los archivos necesarios:
- `vercel.json`: Configuración de rutas y funciones serverless.
- `api/gemini-proxy.js`: Función serverless que reemplaza al servidor local para procesar peticiones a Gemini y videos.

## 2. Configuración en Vercel

1.  Ve a tu dashboard de Vercel y haz clic en **"Add New..."** -> **"Project"**.
2.  Importa tu repositorio de GitHub `analizador-ia-react`.
3.  En la configuración del proyecto ("Configure Project"):
    *   **Framework Preset**: Debería detectar automáticamente `Vite`. Si no, selecciónalo.
    *   **Root Directory**: `./` (por defecto).
    *   **Build Command**: `npm run build` (o `vite build`).
    *   **Output Directory**: `dist` (por defecto).

## 3. Variables de Entorno

Es crucial configurar las variables de entorno para que la aplicación funcione correctamente. Basado en tu configuración actual, debes agregar las siguientes variables en la sección **Environment Variables** de Vercel:

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL de tu proyecto Supabase. |
| `SUPABASE_KEY` | Tu clave pública (anon key) de Supabase. |
| `SUPABASE_SERVICE_KEY` | Tu clave de servicio (service_role key) de Supabase (si se usa en el backend). |
| `GEMINI_API_KEY` | Tu API Key de Google Gemini. |
| `ENCRYPTION_KEY` | Clave utilizada para encriptación (si aplica). |

**Nota:** Asegúrate de copiar los valores exactos de tu archivo `.env.local` o de tu gestor de secretos actual.

## 4. Despliegue

Una vez configuradas las variables, haz clic en **"Deploy"**. Vercel construirá tu aplicación React y desplegará la función serverless en `/api/gemini-proxy`.

## 5. Verificación

Después del despliegue:
1.  Abre la URL proporcionada por Vercel.
2.  Verifica que la aplicación cargue correctamente.
3.  Prueba una funcionalidad que use IA (ej. generar un análisis) para confirmar que la función `/api/gemini-proxy` está respondiendo correctamente.

## Solución de Problemas Comunes

-   **Error 404 en recarga**: Si al recargar una página interna (ej. `/reports`) obtienes un error 404, asegúrate de que el archivo `vercel.json` con las reglas de `rewrites` esté presente en la raíz del proyecto.
-   **Error en subida de video**: Vercel tiene límites de tamaño de payload (4.5MB en Hobby, más en Pro). Si subes videos muy grandes directamente, podrías tener problemas. La implementación actual usa URLs de Supabase para descargar el video en el servidor, lo cual evita enviar el archivo binario en el cuerpo de la petición al proxy, mitigando este límite.
-   **Timeout**: El procesamiento de video puede tardar. Se ha configurado `maxDuration: 60` (segundos) en `vercel.json`, que es el máximo para planes Hobby.
