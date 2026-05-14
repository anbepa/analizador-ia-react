export async function callAiApi(prompt, files, options = {}) {
    const model = options.model || '';
    if (model.toLowerCase().includes('gemini')) {
        return await callGeminiApi(prompt, files, options);
    }
    return await callCopilotApi(prompt, files, options);
}

export async function callCopilotApi(prompt, files, options = {}) {
    console.log('[API] Calling Copilot Proxy with', files.length, 'images');
    const onStatus = options.onStatus;
    const model = options.model || 'gpt-4.1';
    const authToken = options.authToken || null;  // provider_token de GitHub OAuth
    const supabaseToken = options.supabaseToken || null; // JWT de Supabase (para DB lookup en Vercel)

    const apiUrl = '/api/copilot-proxy';
    const headers = { 'Content-Type': 'application/json' };
    
    // Token de GitHub OAuth (para login frescos)
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    // JWT de Supabase (para recuperar token desde DB en producción/Vercel)
    if (supabaseToken) {
        headers['X-Supabase-Token'] = supabaseToken;
    }

    const messages = [
        {
            role: 'user',
            content: [
                { type: 'text', text: prompt }
            ]
        }
    ];

    // Adjuntar imágenes (soportar base64 y URLs remotas)
    files.forEach(file => {
        if (file.dataURL) {
            const isBase64 = file.dataURL.startsWith('data:image/');
            const isRemoteUrl = file.dataURL.startsWith('http');
            
            if (isBase64 || isRemoteUrl) {
                messages[0].content.push({
                    type: 'image_url',
                    image_url: { url: file.dataURL }
                });
            }
        }
    });

    const body = { model, messages };

    const performRequest = async (retries = 3, delay = 2000) => {
        onStatus?.('Enviando solicitud a Copilot...');
        
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                });

                // Si recibimos un 503, 502 o 504, es probable que el servidor se esté despertando o esté temporalmente saturado
                if (response.status === 503 || response.status === 502 || response.status === 504) {
                    console.warn(`[API] Intento ${i + 1} falló con estado ${response.status}. Reintentando en ${delay}ms...`);
                    if (i < retries - 1) {
                        onStatus?.(`Servidor despertando... (Intento ${i + 2}/${retries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || errorData.error || 'Error en la API de Copilot');
                }

                return await response.json();
            } catch (err) {
                if (i === retries - 1) throw err;
                console.error(`[API] Error en intento ${i + 1}:`, err);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    // Use the same queue logic if needed, or call directly
    const result = await performRequest();
    return result.choices[0].message.content;
}

export async function callGeminiApi(prompt, files, options = {}) {
    console.log('[API] Calling Gemini Proxy with', files.length, 'images');
    const onStatus = options.onStatus;
    const model = options.model || 'gemini-1.5-flash';

    const apiUrl = '/api/gemini-proxy';
    const headers = { 'Content-Type': 'application/json' };

    const contents = [
        {
            role: 'user',
            parts: [
                { text: prompt }
            ]
        }
    ];

    // Adjuntar imágenes
    for (const file of files) {
        if (file.dataURL) {
            const matches = file.dataURL.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                contents[0].parts.push({
                    inline_data: {
                        mime_type: matches[1],
                        data: matches[2]
                    }
                });
            }
        }
    }

    const body = { model, contents };

    const performRequest = async (retries = 3, delay = 2000) => {
        onStatus?.('Enviando solicitud a Gemini...');
        
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                });

                if (response.status === 429 || response.status === 503 || response.status === 504) {
                    console.warn(`[API] Gemini Intento ${i + 1} falló con estado ${response.status}. Reintentando en ${delay}ms...`);
                    if (i < retries - 1) {
                        onStatus?.(`Servidor reintentando... (Intento ${i + 2}/${retries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2;
                        continue;
                    }
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.userMessage || errorData.error || 'Error en la API de Gemini');
                }

                return await response.json();
            } catch (err) {
                if (i === retries - 1) throw err;
                console.error(`[API] Gemini Error en intento ${i + 1}:`, err);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    const result = await performRequest();
    
    // Extraer texto de la respuesta de Gemini
    if (result.candidates && result.candidates[0]?.content?.parts) {
        return result.candidates[0].content.parts.map(p => p.text).join('');
    }
    
    throw new Error('Respuesta de Gemini en formato inesperado');
}

export function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}
