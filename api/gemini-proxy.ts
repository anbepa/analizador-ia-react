const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 600;

export const config = {
    maxDuration: 60,
    api: {
        bodyParser: {
            sizeLimit: process.env.GEMINI_PROXY_BODY_LIMIT || '25mb'
        }
    }
};

type RetryableError = Error & { status?: number; details?: unknown };

type GeminiBody = {
    model?: string;
    contents?: unknown;
    system_instruction?: unknown;
};

function isRateLimited(error: RetryableError): boolean {
    const details: any = error?.details;
    const statusFromDetails = details?.error?.status;
    return error?.status === 429 || statusFromDetails === 'RESOURCE_EXHAUSTED';
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeJson(response: Response) {
    try {
        return await response.json();
    } catch (error) {
        console.error('No se pudo parsear JSON de respuesta de Gemini', error);
        return null;
    }
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
    let attempt = 0;
    let lastError: RetryableError | undefined;

    while (attempt < MAX_RETRIES) {
        attempt += 1;
        try {
            const response = await fetch(url, options);

            if (response.status === 429) {
                const retryAfter = BASE_DELAY_MS * 2 ** (attempt - 1);
                if (attempt < MAX_RETRIES) {
                    console.warn(`Gemini respondió 429. Reintento ${attempt + 1}/${MAX_RETRIES} en ${retryAfter}ms`);
                    await delay(retryAfter);
                    continue;
                }

                const error = new Error('Se alcanzó el límite de tasa de Gemini. Intenta de nuevo en unos segundos.') as RetryableError;
                error.status = 429;
                error.details = await safeJson(response);
                throw error;
            }

            if (!response.ok) {
                const errorBody = await safeJson(response);
                const error = new Error(errorBody?.error?.message || 'Error desconocido al invocar Gemini') as RetryableError;
                error.status = response.status;
                error.details = errorBody;
                throw error;
            }

            return response;
        } catch (error) {
            const retryable = isRateLimited(error as RetryableError) && attempt < MAX_RETRIES;
            if (retryable) {
                const waitTime = BASE_DELAY_MS * 2 ** (attempt - 1);
                console.warn(`Backoff de ${waitTime}ms tras error de tasa`);
                await delay(waitTime);
                continue;
            }
            lastError = error as RetryableError;
            break;
        }
    }

    throw lastError ?? new Error('Error desconocido al contactar Gemini');
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ userMessage: 'La API key de Gemini no está configurada.', error: 'GEMINI_API_KEY is missing' });
    }

    let body: GeminiBody = {};

    try {
        if (req.body) {
            body = typeof req.body === 'string' ? JSON.parse(req.body) as GeminiBody : req.body;
        } else {
            const text = await req.text?.();
            body = text ? JSON.parse(text) as GeminiBody : {};
        }
    } catch {
        return res.status(400).json({ error: 'No se pudo leer el payload JSON' });
    }

    const { model, contents, system_instruction: systemInstruction } = body;

    if (!model || !contents) {
        return res.status(400).json({ error: 'Payload inválido. Se requieren "model" y "contents".' });
    }

    const url = `${GEMINI_API_URL}/${encodeURIComponent(model)}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    try {
        const response = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, system_instruction: systemInstruction })
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error en función serverless Gemini:', error);
        const retryExhausted = isRateLimited(error as RetryableError);
        const status = retryExhausted ? 429 : 500;
        const userMessage = retryExhausted
            ? 'Se alcanzó el límite de peticiones a Gemini. Intenta nuevamente en unos instantes.'
            : 'No se pudo completar la solicitud a Gemini.';

        return res.status(status).json({
            error: (error as Error).message || 'Error interno del servidor',
            userMessage,
            details: (error as RetryableError)?.details ?? null
        });
    }
}
