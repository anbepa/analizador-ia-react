import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';

// Configurar el límite de event listeners para evitar warnings
process.setMaxListeners(50);

const app = express();
app.use(express.json());

// Sistema de Rate Limiting para API de Gemini
class RateLimiter {
  constructor(maxRequests = 12, windowMs = 60000) { // 12 peticiones por minuto (margen de seguridad)
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
    this.queue = [];
    this.processing = false;
  }

  async addRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      // Limpiar peticiones antiguas
      const now = Date.now();
      this.requests = this.requests.filter(time => now - time < this.windowMs);

      // Verificar si podemos hacer una petición
      if (this.requests.length < this.maxRequests) {
        const { requestFn, resolve, reject } = this.queue.shift();
        this.requests.push(now);

        console.log(`Rate Limiter: ${this.requests.length}/${this.maxRequests} peticiones en ventana actual`);

        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        // Calcular tiempo de espera hasta la próxima ventana
        const oldestRequest = Math.min(...this.requests);
        const waitTime = this.windowMs - (now - oldestRequest) + 1000; // +1s de margen

        console.log(`Rate Limiter: Límite alcanzado. Esperando ${Math.ceil(waitTime / 1000)}s...`);

        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.processing = false;
  }

  getStatus() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return {
      current: this.requests.length,
      max: this.maxRequests,
      queueLength: this.queue.length,
      canMakeRequest: this.requests.length < this.maxRequests
    };
  }
}

// Instancia global del rate limiter
const rateLimiter = new RateLimiter();

// Función para procesar respuestas que contienen screenshots
function processScreenshotResponse(response) {
  // Buscar rutas de archivos de imagen en la respuesta (con y sin backticks)
  const imagePathRegex = /(?:`([^`]*\.(?:jpeg|jpg|png|gif))`|([\/\w\-\.]+\.(?:jpeg|jpg|png|gif)))/g;
  const matches = [...response.matchAll(imagePathRegex)];

  if (matches.length === 0) {
    return response;
  }

  let processedResponse = response;

  for (const match of matches) {
    // El regex tiene dos grupos de captura: match[1] para backticks, match[2] para rutas sin backticks
    const imagePath = match[1] || match[2];
    console.log(`Procesando imagen: ${imagePath}`);

    try {
      if (fs.existsSync(imagePath)) {
        // Leer el archivo de imagen y convertirlo a base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64Image}`;

        // Reemplazar la ruta del archivo con la imagen base64
        processedResponse = processedResponse.replace(
          match[0],
          `\n\n📸 Screenshot capturado:\n${dataUrl}\n\n`
        );

        console.log(`Imagen convertida a base64: ${imagePath}`);
      } else {
        console.log(`Archivo no encontrado: ${imagePath}`);
      }
    } catch (error) {
      console.error(`Error procesando imagen ${imagePath}:`, error);
    }
  }

  return processedResponse;
}

// Enable CORS for frontend communication
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Endpoint para obtener el estado del rate limiter
app.get('/api/status', (req, res) => {
  const status = rateLimiter.getStatus();
  res.json({
    rateLimiter: status,
    message: status.canMakeRequest ?
      'Listo para procesar peticiones' :
      `Límite alcanzado. ${status.queueLength} peticiones en cola`
  });
});

app.post('/api/chat', async (req, res) => {
  const { prompt, apiKey, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  console.log(`Procesando prompt: ${prompt}`);
  console.log(`Usando modelo: ${model || 'gemini-2.0-flash'}`);

  // Verificar estado del rate limiter
  const status = rateLimiter.getStatus();
  if (status.queueLength > 10) {
    return res.status(429).json({
      error: 'Demasiadas peticiones en cola',
      details: `Hay ${status.queueLength} peticiones esperando. Intenta más tarde.`,
      retryAfter: 60
    });
  }

  try {
    // Usar el rate limiter para controlar las peticiones
    const result = await rateLimiter.addRequest(async () => {
      return await processGeminiRequest(prompt, apiKey, model);
    });

    res.json({ response: result });
  } catch (error) {
    console.error('Error en petición:', error);

    // Manejar errores específicos de rate limiting de la API
    if (error.message && error.message.includes('429')) {
      return res.status(429).json({
        error: 'Límite de API excedido',
        details: 'Has excedido el límite de peticiones de la API de Gemini. Intenta más tarde.',
        retryAfter: 60
      });
    }

    res.status(500).json({
      error: 'Error procesando la consulta',
      details: error.message || 'Error desconocido'
    });
  }
});

// Función separada para procesar peticiones de Gemini
async function processGeminiRequest(prompt, apiKey, model) {
  return new Promise((resolve, reject) => {
    try {
      // Leer la configuración base de MCP
      const baseConfigPath = './gemini.config.json';
      let baseConfig = {};

      if (fs.existsSync(baseConfigPath)) {
        baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'));
      }

      // Crear configuración temporal con los valores del frontend
      const tempConfig = {
        ...baseConfig,
        model: model || baseConfig.model || 'gemini-2.0-flash',
        apiKey: apiKey || baseConfig.apiKey
      };

      // Escribir configuración temporal
      const tempConfigPath = './temp-gemini.config.json';
      fs.writeFileSync(tempConfigPath, JSON.stringify(tempConfig, null, 2));

      // Preparar argumentos para el CLI
      const args = ['@google/gemini-cli', '--prompt', prompt];

      // Agregar modelo si se proporciona
      if (model) {
        args.push('--model', model);
      }

      // Preparar variables de entorno
      const env = { ...process.env };

      // Configurar API key como variable de entorno si se proporciona
      if (apiKey) {
        env.GEMINI_API_KEY = apiKey;
      }

      // Usar el archivo de configuración temporal
      env.GEMINI_CONFIG_PATH = tempConfigPath;

      const cli = spawn('npx', args, {
        env,
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';
      let isResponseSent = false;

      // Función para limpiar recursos
      const cleanup = () => {
        try {
          if (fs.existsSync('./temp-gemini.config.json')) {
            fs.unlinkSync('./temp-gemini.config.json');
          }
        } catch (cleanupError) {
          console.error('Error limpiando archivo temporal:', cleanupError);
        }

        // Limpiar event listeners para evitar memory leaks
        cli.removeAllListeners();

        // Matar el proceso si aún está corriendo
        if (!cli.killed) {
          cli.kill('SIGTERM');
        }
      };

      // Timeout para evitar procesos colgados (30 segundos)
      const timeout = setTimeout(() => {
        if (!isResponseSent) {
          console.error('Timeout: El proceso tardó demasiado en responder');
          isResponseSent = true;
          cleanup();
          reject(new Error('Timeout: El proceso tardó demasiado en responder'));
        }
      }, 30000);

      cli.stdout.on('data', (data) => {
        output += data.toString();
      });

      cli.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`STDERR: ${data}`);
      });

      cli.on('close', (code) => {
        if (isResponseSent) return;

        clearTimeout(timeout);
        isResponseSent = true;
        cleanup();

        if (code !== 0) {
          console.error(`Proceso terminó con código: ${code}`);
          return reject(new Error(`Error procesando la consulta: ${errorOutput || 'Error desconocido'}`));
        }

        console.log(`Respuesta generada: ${output.substring(0, 100)}...`);

        // Procesar la respuesta para extraer imágenes guardadas
        const processedResponse = processScreenshotResponse(output.trim());
        resolve(processedResponse);
      });

      cli.on('error', (error) => {
        if (isResponseSent) return;

        clearTimeout(timeout);
        isResponseSent = true;
        cleanup();

        console.error(`Error ejecutando comando: ${error}`);
        reject(new Error(`Error interno del servidor: ${error.message}`));
      });

    } catch (configError) {
      console.error('Error configurando Gemini CLI:', configError);
      reject(new Error(`Error de configuración: ${configError.message}`));
    }
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listo en http://localhost:${PORT}/api/chat`));
