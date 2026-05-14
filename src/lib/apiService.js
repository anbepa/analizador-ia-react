export async function callAiApi(prompt, files, options = {}) {
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

export function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}
