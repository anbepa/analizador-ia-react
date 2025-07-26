# Integración del Chat con Gemini MCP

## Descripción

Se ha integrado un chat con Gemini MCP en el flujo de "Generar Escenarios con imágenes". Este chat permite interactuar con Gemini para automatización web usando herramientas MCP como Playwright.

## Características

- **Chat sutil y discreto**: Aparece como un botón en el panel de acciones
- **Interfaz minimalista**: Chat compacto que no interfiere con el flujo principal
- **Comunicación con backend**: Se conecta al backend de Gemini MCP en `http://localhost:3000`
- **Manejo de errores**: Muestra errores de conexión y respuestas del servidor
- **Historial de conversación**: Mantiene el historial durante la sesión

## Cómo usar

### 1. Iniciar el backend

Opción A - Solo backend:
```bash
npm run backend
```

Opción B - Backend y frontend juntos:
```bash
npm run dev:full
```

### 2. Usar el chat

1. Ve a la sección "Generar Escenarios con imágenes"
2. En el panel de "Acciones", encontrarás el botón "💬 Chat con Gemini"
3. Haz clic para abrir el chat
4. Escribe tu consulta y presiona Enter o el botón de envío

### 3. Ejemplos de consultas

```
Abre la página https://wwf.whiz.pe/adopcion y haz clic en el botón de "Adoptar"

Navega a https://example.com, busca el campo de email y escribe test@example.com

Toma una captura de pantalla de la página actual
```

### 4. Screenshots Automáticos

El chat ahora captura screenshots automáticamente cuando:
- Navegas a una página web (detecta URLs)
- Realizas acciones como "haz clic", "busca", "escribe"
- Ejecutas comandos de automatización web

**Flujo de screenshots:**
1. Envías un comando de navegación/acción
2. El sistema ejecuta la acción
3. Automáticamente toma un screenshot usando `browser_take_screenshot`
4. El screenshot aparece en el chat con vista previa
5. Puedes enviar todos los screenshots capturados a "Cargar Evidencias" con un clic

**Botón "Enviar a Cargar Evidencias":**
- Aparece cuando hay screenshots capturados
- Transfiere automáticamente todas las imágenes al componente principal
- Limpia la lista de screenshots del chat después del envío

## Configuración del Backend

El backend está configurado en `gemini-mcp-backend/` con:

- **Puerto**: 3000
- **Endpoint**: `/api/chat`
- **Método**: POST
- **Payload**: `{ "prompt": "tu consulta aquí", "apiKey": "tu-api-key", "model": "modelo-seleccionado" }`

### ⚠️ Configuración Importante

**El chat ahora usa la configuración del panel principal del frontend**, no el archivo `gemini.config.json`. 

**Para configurar correctamente:**

1. **Ve al panel "Configuración y Acciones"** en el frontend
2. **Selecciona "Gemini (Google)"** como proveedor
3. **Introduce tu API key de Gemini**
4. **Selecciona el modelo deseado** (gemini-1.5-flash-latest, gemini-1.5-pro-latest, etc.)
5. **Haz clic en "Guardar Configuración"**

El chat automáticamente usará esta configuración para todas las consultas.

### Configuración de MCP Tools

El archivo `gemini-mcp-backend/gemini.config.json` solo se usa para herramientas MCP:

```json
{
  "tools": {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["@playwright/mcp@latest"]
      }
    }
  }
}
```

## Estructura de archivos

```
src/components/GeminiChat.jsx          # Componente del chat
src/components/ConfigurationPanel.jsx  # Panel integrado con el chat
gemini-mcp-backend/                    # Backend de Gemini MCP
├── server.js                         # Servidor Express
├── package.json                      # Dependencias del backend
└── gemini.config.json                # Configuración de Gemini
```

## Funcionalidades del Chat

- ✅ Envío de mensajes
- ✅ Recepción de respuestas
- ✅ Indicador de carga
- ✅ Manejo de errores
- ✅ Limpiar historial
- ✅ Cerrar/abrir chat
- ✅ Soporte para Enter y Shift+Enter
- ✅ Interfaz responsive
- ✅ **Screenshots automáticos** después de acciones web
- ✅ **Visualización de screenshots** en el chat
- ✅ **Envío automático** de screenshots a "Cargar Evidencias"

## Troubleshooting

### El chat no se conecta
- Verifica que el backend esté corriendo en puerto 3000
- Revisa la consola del navegador para errores CORS
- Asegúrate de que la API key de Gemini esté configurada en el panel de configuración

### Errores en el backend
- Revisa los logs del servidor en la terminal
- Verifica que `@google/gemini-cli` esté instalado
- Confirma que hayas configurado tu API key de Gemini en el frontend
- El backend usa variables de entorno (`GEMINI_API_KEY`) para autenticación

### ⚠️ Problemas con modelos específicos
- **Usa `gemini-2.0-flash`** para funcionalidad completa de MCP
- Los modelos `gemini-1.5-flash-latest` y `gemini-1.5-pro-latest` pueden no soportar herramientas de navegación web
- Si ves "Browse tool is not supported", cambia al modelo `gemini-2.0-flash`

### El chat dice "no puedo abrir URLs"
- Verifica que estés usando el modelo `gemini-2.0-flash` (recomendado)
- Asegúrate de que las herramientas MCP estén configuradas correctamente
- El backend debe crear archivos de configuración temporal con las herramientas MCP

### El chat no aparece
- Asegúrate de estar en la sección "Generar Escenarios con imágenes"
- El botón aparece en el panel de "Acciones" al lado derecho