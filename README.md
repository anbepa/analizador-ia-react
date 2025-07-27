# Analizador IA React

Sistema de análisis inteligente con agente especializado en análisis web.

## 🚀 Características

- **Agente de análisis web** - Especializado en obtener y analizar contenido web
- **Chat directo** - Respuestas técnicas sin conversaciones largas  
- **Análisis de evidencias** - Carga y análisis de imágenes
- **Interfaz moderna** - React + Tailwind CSS
- **Backend integrado** - Express.js sencillo para servir el build
- **Compatibilidad** - Soporte para OpenAI, Anthropic y Google Gemini

## 🛠️ Tecnologías

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Express.js
- **Análisis web**: web_fetch para contenido HTTP
- **Procesamiento**: DOMPurify, PDF generation

## 🚀 Instalación

### Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [npm](https://www.npmjs.com/)
- Claves API para los proveedores de IA que utilices:
  - [OpenAI](https://platform.openai.com/)
  - [Anthropic](https://www.anthropic.com/)
  - [Google AI Studio](https://aistudio.google.com/app/apikey)

### Desarrollo Local

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/anbepa/analizador-ia-react.git
   cd analizador-ia-react
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno (opcional):**
   ```bash
   cp .env.example .env
   ```

4. **Ejecuta en modo desarrollo:**
   ```bash
   npm run dev
   ```

5. **Para producción local:**
   ```bash
   NODE_ENV=production npm start
   ```

### Despliegue en Render.com

1. **Variables de entorno requeridas:**
   ```
   NODE_ENV=production
   ```

2. **Comandos de build:**
   ```
   Build Command: npm run render:build
   Start Command: npm run render:start
   ```

## 📋 Scripts Disponibles

- `npm run dev` - Frontend en desarrollo
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run test:build` - Probar build localmente

## 🎯 Uso del Agente

El agente especializado puede:
- **Analizar contenido web**: `"Analiza el contenido de https://example.com"`
- **Obtener información**: `"¿Qué contiene la página https://google.com?"`
- **Respuestas directas**: Sin conversaciones largas, solo resultados