# Analizador IA React

Sistema de análisis inteligente con agente especializado en análisis web usando Gemini.

## 🚀 Características

- **Agente de análisis web** - Especializado en obtener y analizar contenido web
- **Chat directo** - Respuestas técnicas sin conversaciones largas  
- **Análisis de evidencias** - Carga y análisis de imágenes
- **Interfaz moderna** - React + Tailwind CSS
- **Backend integrado** - Express.js con rate limiting

## 🛠️ Tecnologías

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Express.js, Gemini CLI
- **Análisis web**: web_fetch para contenido HTTP
- **Procesamiento**: html2canvas, DOMPurify

## 🚀 Instalación

### Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [npm](https://www.npmjs.com/) 
- API Key de [Google AI Studio](https://aistudio.google.com/app/apikey)

### Desarrollo Local

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/anbepa/analizador-ia-react.git
   cd analizador-ia-react
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   npm run install:backend
   ```

3. **Configura las variables de entorno:**
   ```bash
   # Crea archivo .env
   cp .env.example .env
   
   # Edita .env con tu API key
   GEMINI_API_KEY=tu-api-key-aqui
   GEMINI_MODEL=gemini-2.0-flash
   ```

4. **Ejecuta en modo desarrollo:**
   ```bash
   npm run dev:full
   ```

5. **Para producción local:**
   ```bash
   NODE_ENV=production npm start
   ```

### Despliegue en Render.com

1. **Variables de entorno requeridas:**
   ```
   NODE_ENV=production
   GEMINI_API_KEY=tu-api-key-real
   GEMINI_MODEL=gemini-2.0-flash
   ```

2. **Comandos de build:**
   ```
   Build Command: npm run render:build
   Start Command: npm run render:start
   ```

## 📋 Scripts Disponibles

- `npm run dev` - Frontend en desarrollo
- `npm run backend` - Solo backend
- `npm run dev:full` - Frontend + Backend
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run test:build` - Probar build localmente

## 🎯 Uso del Agente

El agente especializado puede:
- **Analizar contenido web**: `"Analiza el contenido de https://example.com"`
- **Obtener información**: `"¿Qué contiene la página https://google.com?"`
- **Respuestas directas**: Sin conversaciones largas, solo resultados