const DEFAULT_MIN_REQUEST_INTERVAL = 5000;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 800;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isRateLimited(error) {
    return error?.status === 429 || error?.details?.error?.status === 'RESOURCE_EXHAUSTED';
}

class GeminiRequestQueue {
    constructor(minInterval = DEFAULT_MIN_REQUEST_INTERVAL) {
        this.queue = [];
        this.processing = false;
        this.lastRequestTime = 0;
        this.minInterval = minInterval;
    }

    enqueue(requestFn, { onStatus } = {}) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject, onStatus });
            onStatus?.('Solicitud encolada. Se enviará en cuanto sea posible.');
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const { requestFn, resolve, reject, onStatus } = this.queue.shift();
            const elapsed = Date.now() - this.lastRequestTime;
            const waitTime = Math.max(0, this.minInterval - elapsed);

            if (waitTime > 0) {
                onStatus?.(`Esperando ${Math.ceil(waitTime / 1000)}s para respetar el intervalo entre solicitudes...`);
                await wait(waitTime);
            }

            try {
                onStatus?.('Enviando solicitud a Gemini...');
                const result = await this.fetchWithRetry(requestFn, onStatus);
                this.lastRequestTime = Date.now();
                resolve(result);
            } catch (error) {
                reject(this.formatError(error));
            }
        }

        this.processing = false;
    }

    async fetchWithRetry(requestFn, onStatus) {
        let attempt = 0;
        let delay = BASE_RETRY_DELAY;

        while (attempt < MAX_RETRIES) {
            attempt += 1;
            try {
                return await requestFn();
            } catch (error) {
                const retryable = isRateLimited(error) && attempt < MAX_RETRIES;
                if (retryable) {
                    onStatus?.(`Límite de tasa detectado. Reintentando en ${Math.ceil(delay / 1000)}s (intento ${attempt + 1}/${MAX_RETRIES})...`);
                    await wait(delay);
                    delay *= 2;
                    continue;
                }
                throw error;
            }
        }
    }

    formatError(error) {
        if (isRateLimited(error)) {
            return new Error('Se alcanzó el límite de peticiones a Gemini. Por favor espera unos segundos e inténtalo nuevamente.');
        }
        if (error?.message) return error;
        return new Error('No se pudo completar la solicitud a Gemini.');
    }
}

const requestQueue = new GeminiRequestQueue();

export const MIN_REQUEST_INTERVAL = DEFAULT_MIN_REQUEST_INTERVAL;

export function enqueueGeminiCall(requestFn, options = {}) {
    return requestQueue.enqueue(requestFn, options);
}
