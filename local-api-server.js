/* eslint-env node */
/* global process */
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const require = createRequire(import.meta.url)

// Cargar variables de entorno
const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env'
require('dotenv').config({ path: envPath, override: true })

const express = require('express')
const cors = require('cors')
const ffmpeg = require('fluent-ffmpeg')
const { createClient } = require('@supabase/supabase-js')

// Configurar rutas de FFmpeg
try {
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
  const ffprobePath = require('@ffprobe-installer/ffprobe').path
  ffmpeg.setFfmpegPath(ffmpegPath)
  ffmpeg.setFfprobePath(ffprobePath)
  console.log(`[INFO] FFmpeg path: ${ffmpegPath}`)
} catch (e) {
  console.warn('[WARN] No se pudo configurar FFmpeg automáticamente:', e.message)
}

let CopilotClient;
let approveAll;
try {
  const sdk = require('@github/copilot-sdk');
  CopilotClient = sdk.CopilotClient;
  approveAll = sdk.approveAll;
  // Importar el core de copilot para asegurar que esté cargado (ayuda en algunos entornos)
  try { require('@github/copilot'); } catch (e) { /* ignore */ }
  console.log('[INFO] @github/copilot-sdk cargado correctamente');
} catch (error) {
  console.warn('[WARN] @github/copilot-sdk no se pudo cargar.', error?.message);
}

const app = express()
const PORT = process.env.PORT || 3000
const BODY_LIMIT = process.env.GEMINI_PROXY_BODY_LIMIT || '512mb'

app.use(cors())
app.use(express.json({ limit: BODY_LIMIT }))
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }))

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      copilot: !!CopilotClient,
      ffmpeg: !!ffmpeg
    });
});

// --- COPILOT PROXY ---
app.post('/api/copilot-proxy', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let githubToken = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : null;

    // Si no hay token en el header, intentar recuperarlo de Supabase (igual que en Vercel)
    if (!githubToken) {
      const supabaseToken = req.headers['x-supabase-token'];
      if (supabaseToken && process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(
          process.env.VITE_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { data: { user } } = await supabaseAdmin.auth.getUser(supabaseToken);
        if (user?.id) {
          const { data } = await supabaseAdmin
            .from('user_github_tokens')
            .select('provider_token')
            .eq('user_id', user.id)
            .single();
          if (data?.provider_token) {
            githubToken = data.provider_token;
          }
        }
      }
    }

    // Fallback al token de entorno
    if (!githubToken) {
      githubToken = process.env.COPILOT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || null;
    }

    const useLocalUser = !githubToken;

    if (!CopilotClient) {
      return res.status(500).json({
        error: 'Copilot SDK not loaded',
        message: 'El SDK de Copilot no se pudo cargar en el servidor.',
      });
    }

    if (!githubToken && !useLocalUser) {
        return res.status(401).json({
            error: 'GitHub token no disponible',
            message: 'Inicia sesión con GitHub para continuar.'
        });
    }

    const { messages, model = 'gpt-4o' } = req.body;

    const clientConfig = useLocalUser
      ? { useLoggedInUser: true }
      : { gitHubToken: githubToken, useLoggedInUser: false };

    const client = new CopilotClient(clientConfig);
    await client.start();

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

    const response = await session.sendAndWait({
      prompt: textPrompt,
      attachments: attachments
    });

    let content = '';
    if (typeof response === 'string') {
      content = response;
    } else if (response.data && response.data.content) {
      content = response.data.content;
    } else if (response.content && typeof response.content === 'string') {
      content = response.content;
    } else if (response.text && typeof response.text === 'string') {
      content = response.text;
    } else if (Array.isArray(response.content)) {
      content = response.content.map(part => part.text || '').join('');
    } else {
      content = JSON.stringify(response);
    }

    res.status(200).json({
      choices: [{ message: { content: content } }]
    });
  } catch (error) {
    console.error('[ERROR] Copilot API error:', error.message);
    res.status(500).json({ error: error.message });
  }
})

// --- GEMINI PROXY ---
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

app.post('/api/gemini-proxy', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ userMessage: 'La API key de Gemini no está configurada.', error: 'GEMINI_API_KEY is missing' });
    }

    const { model, contents, system_instruction: systemInstruction } = req.body;

    if (!model || !contents) {
        return res.status(400).json({ error: 'Payload inválido. Se requieren "model" y "contents".' });
    }

    const url = `${GEMINI_API_URL}/${encodeURIComponent(model)}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, system_instruction: systemInstruction })
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('[ERROR] Gemini Proxy error:', error.message);
        return res.status(500).json({ error: error.message });
    }
});

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'El payload excede el límite permitido.'
    })
  }
  return next(err)
})

// Middleware de logging para depuración en Render
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Servir archivos estáticos del frontend
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Manejador explícito para la raíz
  app.get('/', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log(`[SERVER] Serving static files from ${distPath}`);
} else {
  // Si no hay dist, responder algo para el health check
  app.get('/', (req, res) => {
    res.status(200).send('API Server Running (No frontend build found)');
  });
}

const startServer = () => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n[SERVER] Running on port ${PORT}`)
  })
};

// En local, podemos intentar liberar el puerto, en Render no es necesario
if (process.env.NODE_ENV !== 'production' && !process.env.RENDER) {
  const killPort = (port) => {
    return new Promise((resolve) => {
      exec(`lsof -ti :${port} | xargs kill -9`, () => {
        setTimeout(resolve, 500);
      });
    });
  };
  killPort(PORT).then(startServer);
} else {
  startServer();
}

