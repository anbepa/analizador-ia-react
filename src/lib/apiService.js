export async function callAiApi(prompt, files, options = {}) {
    return await callCopilotApi(prompt, files, options);
}

export async function callCopilotApi(prompt, files, options = {}) {
    const onStatus = options.onStatus;
    const model = options.model || 'gpt-4o';
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

    // Adjuntar imágenes
    files.forEach(file => {
        if (file.dataURL && file.dataURL.includes(',')) {
            messages[0].content.push({
                type: 'image_url',
                image_url: { url: file.dataURL }
            });
        }
    });

    const body = { model, messages };

    const performRequest = async () => {
        onStatus?.('Enviando solicitud a Copilot...');
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || 'Error en la API de Copilot');
        }

        return response.json();
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
