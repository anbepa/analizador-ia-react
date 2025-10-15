export async function callAiApi(prompt, imageFiles, apiConfig) {
    const provider = apiConfig.provider;
    const providerConfig = apiConfig[provider];

    if (!providerConfig.key || providerConfig.key.trim() === '') {
        throw new Error(`Por favor, introduce y guarda una clave de API válida para ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`);
    }
    
    let apiUrl, headers, body;

    switch(provider) {
        case 'openai':
            apiUrl = 'https://api.openai.com/v1/chat/completions';
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${providerConfig.key}`
            };
            body = {
                model: providerConfig.model,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        ...imageFiles.map(img => ({
                            type: 'image_url',
                            image_url: { url: img.dataUrl }
                        }))
                    ]
                }]
            };
            break;
        
        case 'claude':
             apiUrl = 'https://api.anthropic.com/v1/messages';
             headers = {
                'Content-Type': 'application/json',
                'x-api-key': providerConfig.key,
                'anthropic-version': '2023-06-01'
             };
             body = {
                model: providerConfig.model,
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        ...imageFiles.map(img => ({
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: img.type,
                                data: img.base64
                            }
                        }))
                    ]
                }]
             };
            break;

        case 'gemini':
        default:
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${providerConfig.model}:generateContent?key=${providerConfig.key}`;
            headers = { 'Content-Type': 'application/json' };
            
            // Process images for Gemini API
            const geminiParts = [{ text: prompt }];
            imageFiles.forEach(img => {
                if (img.dataURL && img.dataURL.includes(',')) {
                    const base64Data = img.dataURL.split(',')[1];
                    const mimeType = img.dataURL.split(',')[0].match(/data:([^;]+)/)?.[1] || img.type || 'image/png';
                    
                    geminiParts.push({
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    });
                }
            });
            
            body = {
                contents: [{ parts: geminiParts }]
            };
            break;
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        let errorBody;
        try { 
            errorBody = await response.json(); 
        } catch (e) { 
            errorBody = await response.text(); 
        }
        
        let errorMessage = "Error desconocido en la API";
        
        if (typeof errorBody === 'object' && errorBody.error) {
            if (provider === 'gemini' && errorBody.error.message) {
                const geminiError = errorBody.error.message;
                if (geminiError.includes('Unable to process input image')) {
                    errorMessage = "Una o más imágenes no pudieron ser procesadas. Esto puede ser debido a:\n" +
                                 "• Imágenes corruptas o en formato no válido\n" +
                                 "• Imágenes demasiado grandes (máximo recomendado: 10MB)\n" +
                                 "• Contenido de imagen no reconocible\n\n" +
                                 "Sugerencias:\n" +
                                 "• Verifica que las imágenes se vean correctamente\n" +
                                 "• Intenta con imágenes más pequeñas\n" +
                                 "• Usa formatos comunes (PNG, JPG, WEBP)";
                } else if (geminiError.includes('quota') || geminiError.includes('limit')) {
                    errorMessage = "Se ha excedido el límite de la API de Gemini. Intenta más tarde o verifica tu cuota.";
                } else {
                    errorMessage = `Error de Gemini: ${geminiError}`;
                }
            } else {
                errorMessage = typeof errorBody.error === 'string' ? errorBody.error : JSON.stringify(errorBody.error);
            }
        } else if (typeof errorBody === 'string') {
            errorMessage = errorBody;
        }
        
        throw new Error(errorMessage);
    }
    
    const result = await response.json();
    
    switch(provider) {
        case 'openai':
            return result.choices[0].message.content;
        case 'claude':
            return result.content[0].text;
        case 'gemini':
        default:
             return result.candidates[0].content.parts[0].text;
    }
}

export function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

