/**
 * Vercel Serverless Function: /api/copilot-proxy
 */

import { createClient } from '@supabase/supabase-js';
import { CopilotClient, approveAll } from '@github/copilot-sdk';

export const config = {
    maxDuration: 120,
    api: {
        bodyParser: {
            sizeLimit: '64mb'
        }
    }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { messages, model = 'gpt-4o' } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Payload inválido. Se requiere "messages".' });
        }

        let githubToken = null;

        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            githubToken = authHeader.split(' ')[1];
        }

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

        if (!githubToken) {
            githubToken = process.env.COPILOT_GITHUB_TOKEN || null;
        }

        if (!githubToken) {
            return res.status(401).json({
                error: 'GitHub token no disponible',
                message: 'Por favor, cierra sesión y vuelve a entrar con tu cuenta de GitHub.'
            });
        }

        const client = new CopilotClient({
            gitHubToken: githubToken,
            useLoggedInUser: false
        });
        await client.start();

        const lastMessage = messages[messages.length - 1];
        let textPrompt = '';
        const attachments = [];

        if (typeof lastMessage.content === 'string') {
            textPrompt = lastMessage.content;
        } else if (Array.isArray(lastMessage.content)) {
            lastMessage.content.forEach(part => {
                if (part.type === 'text') textPrompt += part.text;
                else if (part.type === 'image_url' && part.image_url?.url) {
                    const matches = part.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
                    if (matches) attachments.push({ type: 'blob', mimeType: matches[1], data: matches[2] });
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

        return res.status(200).json({ choices: [{ message: { content } }] });

    } catch (error) {
        console.error('[copilot-proxy] Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
