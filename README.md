# Analizador de Pruebas con IA

Esta es una aplicación de React que utiliza IA para analizar flujos de pruebas a partir de evidencias visuales (imágenes). La aplicación permite a los usuarios cargar una secuencia de imágenes, proporcionar contexto y generar un informe de análisis detallado.

## Características

-   **Análisis con IA:** Utiliza modelos de IA (Gemini, OpenAI, Claude) para analizar imágenes y generar informes.
-   **Múltiples Proveedores de IA:** Soporte para los principales proveedores de modelos de IA.
-   **Refinamiento Interactivo:** Permite a los usuarios editar y refinar los informes generados.
-   **Exportación de Informes:** Descarga los informes en formato HTML.
-   **Generación de Tickets:** Crea borradores de tickets de error en formato Markdown para los pasos fallidos.

## Instalación

Sigue estos pasos para instalar y ejecutar el proyecto en tu máquina local.

### Prerrequisitos

-   [Node.js](https://nodejs.org/) (versión 18 o superior)
-   [npm](https://www.npmjs.com/) (generalmente se instala con Node.js)

### Pasos

1.  **Clona el repositorio:**

    ```bash
    git clone https://github.com/anbepa/analizador-ia-react.git
    cd analizador-ia-react
    ```

2.  **Instala las dependencias:**

    ```bash
    npm install
    ```

3.  **Configura variables de entorno para desarrollo:**

    Usa los ejemplos de la carpeta `environments`:

    ```bash
    cp environments/.env.local.example .env.local
    # Luego edita .env.local con tus valores de GEMINI_API_KEY, VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
    # Si envías muchas imágenes (hasta ~30), puedes subir GEMINI_PROXY_BODY_LIMIT (por defecto 512mb en local)
    ```

4.  **Levanta el proxy local de Gemini y la app:**

    En una terminal inicia el proxy, que protege la clave, aplica reintentos y admite payloads grandes configurables.

    ```bash
    node local-api-server.js
    ```

    En otra terminal arranca Vite (que ya proxifica `/api` hacia el puerto 3000 definido en `proxy.conf.json`).

    ```bash
    npm run dev
    ```

    Esto iniciará la aplicación en modo de desarrollo y la abrirá en tu navegador en [http://localhost:5173](http://localhost:5173).

-   El proxy local intenta usar el SDK oficial `@google/generative-ai`; si no está instalado, utiliza una implementación mínima con `fetch`.

## Proxy de Gemini en producción

-   Las peticiones a `/api/gemini-proxy` en producción son atendidas por la función serverless `api/gemini-proxy.ts`.
-   Configura en Vercel las variables `GEMINI_API_KEY`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (puedes guiarte por `environments/.env.vercel.example`).

## Scripts Disponibles

-   `npm run dev`: Inicia la aplicación en modo de desarrollo.
-   `npm run build`: Compila la aplicación para producción.
-   `npm run lint`: Ejecuta el linter de ESLint.
-   `npm run preview`: Sirve la compilación de producción localmente.