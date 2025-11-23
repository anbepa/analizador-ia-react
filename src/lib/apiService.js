import { enqueueGeminiCall } from './geminiService';

export async function callAiApi(prompt, imageFiles, options = {}) {
    const onStatus = options.onStatus;
    const model = options.model || 'gemini-1.5-flash-latest';

    const apiUrl = '/api/gemini-proxy';
    const headers = { 'Content-Type': 'application/json' };

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

    const body = {
        model,
        contents: [{ parts: geminiParts }]
    };

    const performRequest = async () => {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const responseText = await response.text().catch(() => '');
            let errorBody = responseText;

            if (responseText) {
                try {
                    errorBody = JSON.parse(responseText);
                } catch {
                    errorBody = responseText;
                }
            }

            let errorMessage = 'Error desconocido en la API';

            if (response.status === 413) {
                errorMessage = 'El payload enviado es demasiado grande para el proxy. Reduce el tamaño o la cantidad de imágenes e intenta de nuevo.';
            } else if (typeof errorBody === 'object' && errorBody.error) {
                if (errorBody.error.message) {
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
                        errorMessage = 'Se ha excedido el límite de la API de Gemini. Intenta más tarde o verifica tu cuota.';
                    } else {
                        errorMessage = `Error de Gemini: ${geminiError}`;
                    }
                } else {
                    errorMessage = typeof errorBody.error === 'string' ? errorBody.error : JSON.stringify(errorBody.error);
                }
            } else if (typeof errorBody === 'string' && errorBody.trim().length > 0) {
                errorMessage = errorBody;
            }

            const error = new Error(errorMessage);
            error.status = response.status;
            error.details = errorBody;
            throw error;
        }

        return response.json();
    };

    const result = await enqueueGeminiCall(performRequest, { onStatus });

    return result.candidates[0].content.parts[0].text;
}

export function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}
