/* eslint-env node */
/* global process */
import { createRequire } from 'module'
import fs from 'fs'
import os from 'os'
import path from 'path'

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

// Helper to convert timestamp to seconds
function timestampToSeconds(timestamp) {
  if (!timestamp) return 0;
  const parts = timestamp.split(':').map(p => parseInt(p, 10));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

// Endpoint to extract frames from video
app.post('/api/extract-frames', async (req, res) => {
  try {
    const { videoUrl, timestamps } = req.body;

    if (!videoUrl || !timestamps || timestamps.length === 0) {
      return res.status(400).json({ error: 'Missing videoUrl or timestamps' });
    }

    console.log(`[FRAME-EXTRACT] Processing ${timestamps.length} frames from video`);

    // Download video to temp location
    const tempVideoPath = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);
    await downloadFile(videoUrl, tempVideoPath);
    console.log('[FRAME-EXTRACT] Video downloaded to:', tempVideoPath);

    // Get video duration first
    const videoDuration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tempVideoPath, (err, metadata) => {
        if (err) {
          console.error('[FRAME-EXTRACT] Error getting video duration:', err);
          reject(err);
          return;
        }
        const duration = metadata.format.duration;
        console.log(`[FRAME-EXTRACT] Video duration: ${duration} seconds`);
        resolve(duration);
      });
    });

    const frames = [];

    // Extract each frame
    for (const ts of timestamps) {
      // Skip if timestamp is beyond video duration
      if (ts.seconds >= videoDuration) {
        console.log(`[FRAME-EXTRACT] Skipping step ${ts.stepNumber} - timestamp ${ts.seconds}s exceeds video duration ${videoDuration}s`);
        continue;
      }

      const frameFilename = `frame_step_${ts.stepNumber}_${Date.now()}.jpg`;
      const outputFolder = os.tmpdir();
      const expectedPath = path.join(outputFolder, frameFilename);

      console.log(`[FRAME-EXTRACT] Attempting to extract frame for step ${ts.stepNumber}`);
      console.log(`[FRAME-EXTRACT] Expected output: ${expectedPath}`);
      console.log(`[FRAME-EXTRACT] Timestamp: ${ts.seconds} seconds (video duration: ${videoDuration}s)`);

      await new Promise((resolve, reject) => {
        ffmpeg(tempVideoPath)
          .screenshots({
            timestamps: [ts.seconds],
            filename: frameFilename,
            folder: outputFolder,
            size: '1920x1080'
          })
          .on('end', () => {
            console.log(`[FRAME-EXTRACT] FFmpeg 'end' event fired for step ${ts.stepNumber}`);

            // List files in temp directory to see what was actually created
            const filesInTemp = fs.readdirSync(outputFolder).filter(f => f.includes('frame'));
            console.log(`[FRAME-EXTRACT] Frame files in temp dir:`, filesInTemp);

            // Check if expected file exists
            if (!fs.existsSync(expectedPath)) {
              console.error(`[FRAME-EXTRACT] Expected file not found: ${expectedPath}`);

              // Try to find the actual file
              const possibleFile = filesInTemp.find(f => f.includes(`step_${ts.stepNumber}`));
              if (possibleFile) {
                const actualPath = path.join(outputFolder, possibleFile);
                console.log(`[FRAME-EXTRACT] Found alternative file: ${actualPath}`);

                try {
                  const frameData = fs.readFileSync(actualPath);
                  const base64Frame = `data:image/jpeg;base64,${frameData.toString('base64')}`;

                  frames.push({
                    stepNumber: ts.stepNumber,
                    timestamp: ts.timestamp,
                    url: base64Frame
                  });

                  fs.unlinkSync(actualPath);
                  console.log(`[FRAME-EXTRACT] Successfully used alternative file for step ${ts.stepNumber}`);
                  resolve();
                  return;
                } catch (err) {
                  console.error(`[FRAME-EXTRACT] Error reading alternative file:`, err);
                }
              }

              console.error(`[FRAME-EXTRACT] No suitable file found for step ${ts.stepNumber}`);
              resolve(); // Continue with other frames
              return;
            }

            try {
              // Read frame as base64
              const frameData = fs.readFileSync(expectedPath);
              const base64Frame = `data:image/jpeg;base64,${frameData.toString('base64')}`;

              frames.push({
                stepNumber: ts.stepNumber,
                timestamp: ts.timestamp,
                url: base64Frame
              });

              // Cleanup frame file
              fs.unlinkSync(expectedPath);
              console.log(`[FRAME-EXTRACT] Successfully extracted frame for step ${ts.stepNumber}`);
              resolve();
            } catch (readError) {
              console.error(`[FRAME-EXTRACT] Error reading frame file:`, readError);
              resolve(); // Continue with other frames
            }
          })
          .on('error', (err) => {
            console.error(`[FRAME-EXTRACT] FFmpeg error for step ${ts.stepNumber}:`, err.message);
            resolve(); // Continue with other frames
          });
      });
    }

    // Cleanup video file
    if (fs.existsSync(tempVideoPath)) {
      fs.unlinkSync(tempVideoPath);
    }

    console.log(`[FRAME-EXTRACT] Successfully extracted ${frames.length} frames out of ${timestamps.length} requested`);
    res.status(200).json({ frames });

  } catch (error) {
    console.error('[ERROR] Frame extraction error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

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

app.listen(PORT, () => {
  console.log(`\n[SERVER] Local API server running on http://localhost:${PORT}`)
  console.log(`[ENDPOINT] http://localhost:${PORT}/api/gemini-proxy`)
  console.log(`[ENDPOINT] http://localhost:${PORT}/api/extract-frames`)
  console.log(`[API_KEY] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing'}`)
  console.log(`[FFMPEG] Path: ${ffmpegPath}`)
  console.log(`[FFPROBE] Path: ${ffprobePath}\n`)
})
