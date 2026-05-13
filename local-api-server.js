/* eslint-env node */
/* global process */
import { createRequire } from 'module'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const require = createRequire(import.meta.url)

require('dotenv').config({ path: '.env.local', override: true })
const express = require('express')
const cors = require('cors')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe').path
ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

let CopilotClient;
let approveAll;
try {
  const sdk = require('@github/copilot-sdk');
  CopilotClient = sdk.CopilotClient;
  approveAll = sdk.approveAll;
  console.log('[INFO] @github/copilot-sdk cargado correctamente');
} catch (error) {
  console.warn('[WARN] @github/copilot-sdk no está instalado.', error?.message);
}

const app = express()
const PORT = process.env.PORT || 3000
const BODY_LIMIT = process.env.GEMINI_PROXY_BODY_LIMIT || '512mb'

app.use(cors())
app.use(express.json({ limit: BODY_LIMIT }))
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }))

const GITHUB_TOKEN = process.env.COPILOT_GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
    console.warn('[WARN] COPILOT_GITHUB_TOKEN no configurada en .env.local. Se requerirá token del cliente.');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', copilot: !!GITHUB_TOKEN });
});

app.post('/api/copilot-proxy', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const clientToken = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : null;
    const envToken = process.env.COPILOT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || null;

    // Decidir estrategia de autenticación
    // 1. Si viene token del cliente (OAuth GitHub), usarlo directamente
    // 2. Si hay token en .env.local, usarlo como fallback
    // 3. Si no hay token, usar el usuario local de Copilot (VS Code autenticado)
    const useLocalUser = !clientToken && !envToken;
    const githubToken = clientToken || envToken || null;

    if (useLocalUser) {
      console.log('[API] No token provided - using local Copilot user session');
    } else {
      console.log('[API] Using GitHub token from', clientToken ? 'client OAuth' : '.env.local');
    }

    if (!CopilotClient) {
      return res.status(500).json({
        error: 'Copilot SDK not loaded',
        message: 'El SDK de Copilot no se pudo cargar en el servidor.',
      });
    }

    const { messages, model = 'gpt-4o' } = req.body;

    console.log(`[API] Copilot API call received (model: ${model}, strategy: ${useLocalUser ? 'local-user' : 'token'})`);

    const clientConfig = useLocalUser
      ? { useLoggedInUser: true }
      : { gitHubToken: githubToken, useLoggedInUser: false };

    const client = new CopilotClient(clientConfig);
    
    await client.start();

    // Extract text and images from the messages
    const lastMessage = messages[messages.length - 1];
    let textPrompt = '';
    const attachments = [];

    if (typeof lastMessage.content === 'string') {
      textPrompt = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      lastMessage.content.forEach(part => {
        if (part.type === 'text') {
          textPrompt += part.text;
        } else if (part.type === 'image_url' && part.image_url && part.image_url.url) {
          const url = part.image_url.url;
          // Extract base64 and mimeType from data URL
          const matches = url.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            attachments.push({
              type: 'blob',
              mimeType: matches[1],
              data: matches[2]
            });
          }
        }
      });
    }

    const session = await client.createSession({
      model: model,
      onPermissionRequest: approveAll
    });

    console.log(`[API] Sending prompt to Copilot with ${attachments.length} attachments`);

    const response = await session.sendAndWait({
      prompt: textPrompt,
      attachments: attachments
    });

    console.log('[DEBUG] Copilot raw response:', JSON.stringify(response, null, 2));

    // The SDK response structure might vary, let's try to find the content
    let content = '';
    if (typeof response === 'string') {
      content = response;
    } else if (response.data && response.data.content) {
      // Structure found in logs: response.data.content
      content = response.data.content;
    } else if (response.content && typeof response.content === 'string') {
      content = response.content;
    } else if (response.text && typeof response.text === 'string') {
      content = response.text;
    } else if (Array.isArray(response.content)) {
      // If it's an array of message parts
      content = response.content.map(part => part.text || '').join('');
    } else {
      content = JSON.stringify(response);
    }

    console.log('[SUCCESS] Copilot response successful');
    // Format the response to be compatible with what the frontend expects (OpenAI-like)
    res.status(200).json({
      choices: [
        {
          message: {
            content: content
          }
        }
      ]
    });
  } catch (error) {
    console.error('[ERROR] Copilot API error:', error.message);
    res.status(500).json({ error: error.message });
  }
})

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'El payload excede el límite permitido. Reduce el tamaño o cantidad de imágenes y vuelve a intentarlo.'
    })
  }
  return next(err)
})

// Servir archivos estáticos del frontend (React build)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log(`[SERVER] Serving static files from ${distPath}`);

  // Manejar cualquier otra ruta devolviendo index.html (SPA fallback)
  // Esto debe ir DESPUÉS de las rutas de API
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn(`[WARN] 'dist' directory not found. Frontend will not be served. Run 'npm run build' first.`);
}

const killPort = (port) => {
  return new Promise((resolve) => {
    exec(`lsof -ti :${port} | xargs kill -9`, (error) => {
      if (!error) {
        console.log(`[SERVER] Process on port ${port} killed.`);
      }
      setTimeout(resolve, 1000);
    });
  });
};

killPort(PORT).then(() => {
  app.listen(PORT, () => {
    console.log(`\n[SERVER] Local API server running on http://localhost:${PORT}`)
    console.log(`[ENDPOINT] http://localhost:${PORT}/api/copilot-proxy`)
    console.log(`[FFMPEG] Path: ${ffmpegPath}`)
    console.log(`[FFPROBE] Path: ${ffprobePath}\n`)
  })
});
