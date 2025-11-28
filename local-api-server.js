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

let GoogleGenerativeAI
let GoogleAIFileManager
try {
  ; ({ GoogleGenerativeAI } = require('@google/generative-ai'))
    ; ({ GoogleAIFileManager } = require('@google/generative-ai/server'))
} catch (error) {
  console.warn('[WARN] @google/generative-ai no está instalado. Usando una implementación mínima con fetch.', error?.message)

  GoogleGenerativeAI = class {
    constructor(apiKey) {
      this.apiKey = apiKey
    }

    getGenerativeModel({ model }) {
      return {
        generateContent: async ({ contents, generationConfig }) => {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${this.apiKey}`

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig }),
          })

          if (!response.ok) {
            const errorBody = await response.json().catch(() => null)
            const message = errorBody?.error?.message || 'Error al llamar a Gemini'
            const err = new Error(message)
            err.details = errorBody
            throw err
          }

          const data = await response.json()
          return { response: data }
        },
      }
    }
  }
}

const app = express()
const PORT = process.env.PORT || 3000
const BODY_LIMIT = process.env.GEMINI_PROXY_BODY_LIMIT || '512mb'

app.use(cors())
app.use(express.json({ limit: BODY_LIMIT }))
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }))



// Helper to download file from URL to temp path
async function downloadFile(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
}


app.post('/api/gemini-proxy', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error('[ERROR] GEMINI_API_KEY no configurada en .env.local')
      return res.status(500).json({
        error: 'GEMINI_API_KEY not configured',
        message: 'Configure GEMINI_API_KEY en .env.local',
      })
    }

    const { payload, hasVideo } = req.body
    const { contents, generationConfig } = payload || req.body

    console.log(`[API] Gemini API call received (action: ${req.body.action || 'direct'}, hasVideo: ${hasVideo})`)

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    // If request has video, we need to process it via File API
    if (hasVideo && GoogleAIFileManager) {
      const fileManager = new GoogleAIFileManager(apiKey);

      // Iterate through parts to find video URLs
      for (const part of contents[0].parts) {
        if (part.file_data && part.file_data.file_uri && part.file_data.file_uri.startsWith('http')) {
          console.log('[API] Processing video from URL:', part.file_data.file_uri);

          const tempFilePath = path.join(os.tmpdir(), `gemini_video_${Date.now()}.mp4`);

          try {
            // 1. Download video from Supabase URL
            await downloadFile(part.file_data.file_uri, tempFilePath);
            console.log('[API] Video downloaded to temp file');

            // 2. Upload to Google AI File API
            const uploadResult = await fileManager.uploadFile(tempFilePath, {
              mimeType: part.file_data.mime_type,
              displayName: "Video Analysis Upload"
            });
            console.log(`[API] Uploaded file: ${uploadResult.file.displayName} as ${uploadResult.file.uri}`);

            // 3. Wait for processing to complete
            let file = await fileManager.getFile(uploadResult.file.name);
            while (file.state === "PROCESSING") {
              console.log('[API] Waiting for video processing...');
              await new Promise((resolve) => setTimeout(resolve, 2000));
              file = await fileManager.getFile(uploadResult.file.name);
            }

            if (file.state === "FAILED") {
              throw new Error("Video processing failed.");
            }
            console.log(`[API] Video processing complete: ${file.uri}`);

            // 4. Update the part with the correct file URI for Gemini
            part.file_data.file_uri = file.uri;

          } catch (err) {
            console.error('[ERROR] Video processing error:', err);
            throw err;
          } finally {
            // Cleanup temp file
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
          }
        }
      }
    }

    const result = await model.generateContent({
      contents,
      generationConfig,
    })

    console.log('[SUCCESS] Gemini response successful')
    res.status(200).json(result.response)
  } catch (error) {
    console.error('[ERROR] Gemini API error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    console.error('[ERROR] Payload too large for Gemini proxy', err.message)
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
    console.log(`[ENDPOINT] http://localhost:${PORT}/api/gemini-proxy`)
    console.log(`[API_KEY] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing'}`)
    console.log(`[FFMPEG] Path: ${ffmpegPath}`)
    console.log(`[FFPROBE] Path: ${ffprobePath}\n`)
  })
});
