/**
 * Vercel Serverless Function: /api/copilot-proxy
 *
 * Arquitectura de autenticación profesional:
 * 1. El frontend envía el JWT de Supabase en el header X-Supabase-Token
 * 2. Este serverless function valida el JWT y recupera el provider_token
 *    de GitHub del usuario desde la tabla `user_github_tokens` en Supabase
 * 3. Usa ese token para llamar al SDK de Copilot
 *
 * Funciona tanto en local (node local-api-server.js) como en Vercel (producción).
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
    maxDuration: 120,
    api: {
        bodyParser: {
            sizeLimit: process.env.COPILOT_PROXY_BODY_LIMIT || '64mb'
        }
    }
};

let CopilotClient;
let approveAll;
try {
    const sdk = await import('@github/copilot-sdk');
    CopilotClient = sdk.CopilotClient;
    approveAll = sdk.approveAll;
} catch (err) {
    console.warn('[copilot-proxy] SDK no disponible:', err.message);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    if (!CopilotClient) {
        return res.status(500).json({ error: 'Copilot SDK no disponible en este entorno.' });
    }

    try {
        const { messages, model = 'gpt-4o' } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Payload inválido. Se requiere "messages".' });
        }

        // ── Estrategia de autenticación (en orden de prioridad) ──────────────
        // 1. Token del cliente en header Authorization (login fresco OAuth)
        // 2. Token recuperado desde Supabase DB (sesiones restauradas / Vercel)
        // 3. Token de entorno .env.local (solo desarrollo, opcional)
        let githubToken = null;

        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            githubToken = authHeader.split(' ')[1];
            console.log('[copilot-proxy] Token desde header Authorization (OAuth fresco)');
        }

        if (!githubToken) {
            // Leer el token de GitHub desde Supabase DB usando el JWT del usuario
            const supabaseToken = req.headers['x-supabase-token'];
            if (supabaseToken && process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
                // En producción: usar service role para leer el token del usuario autenticado
                const supabaseAdmin = createClient(
                    process.env.VITE_SUPABASE_URL,
                    process.env.SUPABASE_SERVICE_ROLE_KEY
                );
                // Verificar el JWT del usuario y obtener su ID
                const { data: { user } } = await supabaseAdmin.auth.getUser(supabaseToken);
                if (user?.id) {
                    const { data } = await supabaseAdmin
                        .from('user_github_tokens')
                        .select('provider_token')
                        .eq('user_id', user.id)
                        .single();
                    if (data?.provider_token) {
                        githubToken = data.provider_token;
                        console.log('[copilot-proxy] Token recuperado desde Supabase DB (producción)');
                    }
                }
            }
        }

        if (!githubToken) {
            // Fallback desarrollo local (opcional, no requerido en producción)
            githubToken = process.env.COPILOT_GITHUB_TOKEN || null;
            if (githubToken) console.log('[copilot-proxy] Token desde .env.local (desarrollo)');
        }

        if (!githubToken) {
            return res.status(401).json({
                error: 'GitHub token no disponible',
                message: 'Por favor, cierra sesión y vuelve a entrar con tu cuenta de GitHub para renovar el acceso.'
            });
        }
        // ─────────────────────────────────────────────────────────────────────

        console.log(`[copilot-proxy] Llamando a Copilot (model: ${model})`);

        const client = new CopilotClient({
            gitHubToken: githubToken,
            useLoggedInUser: false
        });
        await client.start();

        // Extraer texto e imágenes del último mensaje
        const lastMessage = messages[messages.length - 1];
        let textPrompt = '';
        const attachments = [];

        if (typeof lastMessage.content === 'string') {
            textPrompt = lastMessage.content;
        } else if (Array.isArray(lastMessage.content)) {
            lastMessage.content.forEach(part => {
                if (part.type === 'text') {
                    textPrompt += part.text;
                } else if (part.type === 'image_url' && part.image_url?.url) {
                    const matches = part.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
                    if (matches) {
                        attachments.push({ type: 'blob', mimeType: matches[1], data: matches[2] });
                    }
                }
            });
        }

        const session = await client.createSession({ model, onPermissionRequest: approveAll });
        const response = await session.sendAndWait({ prompt: textPrompt, attachments });

        let content = '';
        if (typeof response === 'string') content = response;
        else if (response?.data?.content) content = response.data.content;
        else if (typeof response?.content === 'string') content = response.content;
        else if (typeof response?.text === 'string') content = response.text;
        else if (Array.isArray(response?.content)) content = response.content.map(p => p.text || '').join('');
        else content = JSON.stringify(response);

        console.log('[copilot-proxy] Respuesta exitosa');

        return res.status(200).json({
            choices: [{ message: { content } }]
        });

    } catch (error) {
        console.error('[copilot-proxy] Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
