/* eslint-env node */
/* global process */
import http from 'node:http';
import { URL } from 'node:url';
import { config as loadEnv } from './local-dotenv.js';

loadEnv({ path: '.env.local' });

const PORT = process.env.PORT || 3000;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 600;

function sendJson(res, status, payload) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    });
    res.end(JSON.stringify(payload));
}

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            if (!data) return resolve({});
            try {
                resolve(JSON.parse(data));
            } catch (err) {
                reject(err);
            }
        });
        req.on('error', reject);
    });
}

function isRateLimited(error) {
    return error?.status === 429 || error?.details?.error?.status === 'RESOURCE_EXHAUSTED';
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options) {
    let attempt = 0;
    let lastError;

    while (attempt < MAX_RETRIES) {
        attempt += 1;
        try {
            const response = await fetch(url, options);

            if (response.status === 429) {
                const retryAfter = BASE_DELAY_MS * 2 ** (attempt - 1);
                if (attempt < MAX_RETRIES) {
                    console.warn(`Gemini respondió 429. Reintentando en ${retryAfter} ms (intento ${attempt + 1}/${MAX_RETRIES})`);
                    await delay(retryAfter);
                    continue;
                }

                const error = new Error('Se alcanzó el límite de tasa de Gemini. Intenta de nuevo en unos segundos.');
                error.status = 429;
                error.details = await safeJson(response);
                throw error;
            }

            if (!response.ok) {
                const errorBody = await safeJson(response);
                const error = new Error(errorBody?.error?.message || 'Error desconocido al invocar Gemini');
                error.status = response.status;
                error.details = errorBody;
                throw error;
            }

            return response;
        } catch (error) {
            lastError = error;
            if (isRateLimited(error) && attempt < MAX_RETRIES) {
                const waitTime = BASE_DELAY_MS * 2 ** (attempt - 1);
                console.warn(`Backoff por ${waitTime} ms tras recibir límite de tasa de Gemini`);
                await delay(waitTime);
                continue;
            }
            break;
        }
    }

    throw lastError;
}

async function safeJson(response) {
    try {
        return await response.json();
    } catch (err) {
        console.error('No se pudo parsear JSON de error de Gemini:', err);
        return null;
    }
}

async function handleGeminiProxy(req, res) {
    if (req.method === 'OPTIONS') {
        return sendJson(res, 200, { ok: true });
    }

    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Método no permitido' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return sendJson(res, 500, { error: 'La API key de Gemini no está configurada en el servidor.' });
    }

    try {
        const body = await parseRequestBody(req);
        const { model, contents, system_instruction: systemInstruction } = body;

        if (!model || !contents) {
            return sendJson(res, 400, { error: 'Payload inválido. Se requieren "model" y "contents".' });
        }

        const url = `${GEMINI_API_URL}/${encodeURIComponent(model)}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, system_instruction: systemInstruction })
        });

        const data = await response.json();
        return sendJson(res, 200, data);
    } catch (error) {
        console.error('Error en el proxy de Gemini:', error);
        const status = error?.status === 429 ? 429 : 500;
        const userMessage = isRateLimited(error)
            ? 'Se alcanzó el límite de peticiones a Gemini. Por favor, espera e inténtalo de nuevo.'
            : 'No se pudo completar la solicitud a Gemini.';

        return sendJson(res, status, {
            error: error?.message || 'Error interno del servidor',
            userMessage,
            details: error?.details || null
        });
    }
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/api/gemini-proxy') {
        return handleGeminiProxy(req, res);
    }

    sendJson(res, 404, { error: 'Ruta no encontrada' });
});

server.listen(PORT, () => {
    console.log(`Servidor local de proxy Gemini escuchando en http://localhost:${PORT}`);
});
