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

3.  **Configura las claves de API:**

    La aplicación requiere claves de API para los servicios de IA que desees utilizar.
    -   Abre la aplicación en tu navegador.
    -   Ve al panel de "Configuración y Acciones".
    -   Selecciona tu proveedor de IA (Gemini, OpenAI o Claude).
    -   Introduce tu clave de API y selecciona un modelo.
    -   Haz clic en "Guardar Configuración". La configuración se guardará en el almacenamiento local de tu navegador.

4.  **Configura la clave de Gemini para desarrollo:**

    Crea un archivo `.env.local` en la raíz del proyecto con tu clave de Gemini.

    ```bash
    echo "GEMINI_API_KEY=tu-clave" > .env.local
    ```

5.  **Levanta el proxy local de Gemini y la app:**

    En una terminal inicia el proxy, que protege la clave y aplica reintentos.

    ```bash
    node local-api-server.js
    ```

    En otra terminal arranca Vite (que ya proxifica `/api` hacia el puerto 3000 definido en `proxy.conf.json`).

    ```bash
    npm run dev
    ```

    Esto iniciará la aplicación en modo de desarrollo y la abrirá en tu navegador en [http://localhost:5173](http://localhost:5173).

## Proxy de Gemini en producción

-   Las peticiones a `/api/gemini-proxy` en producción son atendidas por la función serverless `api/gemini-proxy.ts`.
-   Configura la variable `GEMINI_API_KEY` en Vercel para que la función pueda invocar Gemini sin exponer la clave al cliente.

## Scripts Disponibles

-   `npm run dev`: Inicia la aplicación en modo de desarrollo.
-   `npm run build`: Compila la aplicación para producción.
-   `npm run lint`: Ejecuta el linter de ESLint.
-   `npm run preview`: Sirve la compilación de producción localmente.