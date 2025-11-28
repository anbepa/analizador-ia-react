import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';

export const config = {
    maxDuration: 60, // Aumentar timeout para procesamiento de video (máx 60s en plan Hobby, más en Pro)
    api: {
        bodyParser: {
            sizeLimit: process.env.GEMINI_PROXY_BODY_LIMIT || '50mb', // Límite de Vercel
        },
    },
};

// Helper to download file from URL to temp path
async function downloadFile(url, destPath) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);

    // Usar stream pipeline para eficiencia
    const fileStream = fs.createWriteStream(destPath);
    await pipeline(response.body, fileStream);
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('[ERROR] GEMINI_API_KEY no configurada');
            return res.status(500).json({
                error: 'GEMINI_API_KEY not configured',
                message: 'Configure GEMINI_API_KEY en las variables de entorno',
            });
        }

        const { payload, hasVideo } = req.body;
        // Soporte para estructura directa o anidada en payload
        const { contents, generationConfig } = payload || req.body;

        console.log(`[API] Gemini API call received (hasVideo: ${hasVideo})`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Procesamiento de video si es necesario
        if (hasVideo) {
            const fileManager = new GoogleAIFileManager(apiKey);

            // Iterar partes para encontrar URLs de video
            // Nota: Asumimos estructura standard de Gemini contents
            if (contents && contents[0] && contents[0].parts) {
                for (const part of contents[0].parts) {
                    if (part.file_data && part.file_data.file_uri && part.file_data.file_uri.startsWith('http')) {
                        console.log('[API] Processing video from URL:', part.file_data.file_uri);

                        const tempFilePath = path.join(os.tmpdir(), `gemini_video_${Date.now()}.mp4`);

                        try {
                            // 1. Download video
                            await downloadFile(part.file_data.file_uri, tempFilePath);
                            console.log('[API] Video downloaded to temp file');

                            // 2. Upload to Google AI File API
                            const uploadResult = await fileManager.uploadFile(tempFilePath, {
                                mimeType: part.file_data.mime_type,
                                displayName: "Video Analysis Upload"
                            });
                            console.log(`[API] Uploaded file: ${uploadResult.file.displayName} as ${uploadResult.file.uri}`);

                            // 3. Wait for processing
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
        }

        const result = await model.generateContent({
            contents,
            generationConfig,
        });

        console.log('[SUCCESS] Gemini response successful');
        const response = await result.response;
        // Serializar la respuesta de forma segura
        res.status(200).json({
            candidates: response.candidates,
            promptFeedback: response.promptFeedback
        });

    } catch (error) {
        console.error('[ERROR] Gemini API error:', error.message);
        res.status(500).json({
            error: error.message,
            details: error.details || null
        });
    }
}
