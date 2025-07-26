import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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



// Servir archivos estáticos del frontend (después del build)
app.use(express.static(path.join(__dirname, 'dist')));

// Enable CORS for API calls
app.use('/api', (req, res, next) => {
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

// Función para usar CLI con MCP - ÚNICA IMPLEMENTACIÓN
async function processGeminiWithMCP(prompt, apiKey, model) {
  return new Promise((resolve, reject) => {
    try {
      // Leer la configuración base de MCP
      const baseConfigPath = path.join(__dirname, 'gemini-mcp-backend', 'gemini.config.json');
      let baseConfig = {};

      if (fs.existsSync(baseConfigPath)) {
        baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'));
      }

      // Obtener API key de variables de entorno
      const apiKeyFromEnv = process.env.GEMINI_API_KEY;
      
      // Validar que la API key esté configurada
      if (!apiKeyFromEnv) {
        throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
      }

      // Crear configuración temporal SIN API key (el CLI la tomará de la variable de entorno)
      const tempConfig = {
        ...baseConfig,
        model: process.env.GEMINI_MODEL || baseConfig.model || 'gemini-2.0-flash'
      };

      // Escribir configuración temporal (sin API key)
      const tempConfigPath = path.join(__dirname, 'temp-gemini.config.json');
      fs.writeFileSync(tempConfigPath, JSON.stringify(tempConfig, null, 2));

      // Crear prompt especializado para análisis web
      const systemPrompt = `AGENTE DE ANÁLISIS WEB - MODO DIRECTO

Eres un agente especializado en análisis de contenido web. EJECUTA las acciones inmediatamente sin pedir confirmaciones.

REGLAS ESTRICTAS:
- NO preguntes por permisos
- NO pidas confirmaciones  
- USA web_fetch para obtener contenido de páginas web
- ANALIZA y RESUME el contenido obtenido
- RESPONDE de forma concisa y técnica
- NO menciones herramientas browser (no están disponibles)

HERRAMIENTAS DISPONIBLES:
- web_fetch(url) - Obtener contenido HTML de una página
- Análisis de texto y contenido web
- Búsquedas y consultas generales

COMANDO: ${prompt}

EJECUTA AHORA:`;

      // Preparar argumentos para el CLI
      const args = ['@google/gemini-cli', '--prompt', systemPrompt, '--model', tempConfig.model];

      // Preparar variables de entorno para Gemini CLI
      const env = { 
        ...process.env,
        // Asegurar que la API key esté disponible para el CLI
        GEMINI_API_KEY: apiKeyFromEnv,
        // Configurar el archivo de configuración temporal
        GEMINI_CONFIG_PATH: tempConfigPath,
        // Configurar el modelo por defecto
        GEMINI_MODEL: tempConfig.model
      };

      console.log(`Usando CLI con MCP para: ${prompt.substring(0, 50)}...`);
      console.log(`Comando completo: npx ${args.join(' ')}`);
      console.log(`API Key en env: ${env.GEMINI_API_KEY ? 'Configurada' : 'NO configurada'}`);
      console.log(`Archivo config temporal: ${tempConfigPath}`);

      const cli = spawn('npx', args, { env, cwd: __dirname });

      let output = '';
      let errorOutput = '';
      let isResponseSent = false;

      // Función para limpiar recursos
      const cleanup = () => {
        try {
          if (fs.existsSync(tempConfigPath)) {
            fs.unlinkSync(tempConfigPath);
          }
        } catch (cleanupError) {
          console.error('Error limpiando archivo temporal:', cleanupError);
        }
        cli.removeAllListeners();
        if (!cli.killed) {
          cli.kill('SIGTERM');
        }
      };

      // Timeout de 2 minutos para operaciones MCP
      const timeout = setTimeout(() => {
        if (!isResponseSent) {
          console.error('Timeout MCP: El proceso tardó demasiado');
          isResponseSent = true;
          cleanup();
          reject(new Error('Timeout: La operación MCP tardó demasiado en completarse'));
        }
      }, 120000);

      cli.stdout.on('data', (data) => {
        output += data.toString();
      });

      cli.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`MCP STDERR: ${data}`);
      });

      cli.on('close', (code) => {
        if (isResponseSent) return;
        clearTimeout(timeout);
        isResponseSent = true;
        cleanup();

        if (code !== 0) {
          console.error(`MCP terminó con código: ${code}`);
          return reject(new Error(`Error MCP: ${errorOutput || 'Error desconocido'}`));
        }

        console.log(`MCP respuesta: ${output.substring(0, 100)}...`);
        resolve(output.trim());
      });

      cli.on('error', (error) => {
        if (isResponseSent) return;
        clearTimeout(timeout);
        isResponseSent = true;
        cleanup();
        console.error(`Error MCP: ${error}`);
        reject(new Error(`Error MCP: ${error.message}`));
      });

    } catch (configError) {
      console.error('Error configurando MCP:', configError);
      reject(new Error(`Error de configuración MCP: ${configError.message}`));
    }
  });
}



// Función principal para procesar peticiones de Gemini - SOLO MCP
async function processGeminiRequest(prompt, apiKey, model) {
  try {
    const finalApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!finalApiKey) {
      throw new Error('API key de Gemini no configurada');
    }

    console.log(`API Key configurada: Sí`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);
    console.log('🔧 Usando CLI con MCP para todas las consultas');

    // SIEMPRE usar MCP con CLI
    return await processGeminiWithMCP(prompt, apiKey, model);

  } catch (error) {
    console.error('Error en processGeminiRequest:', error);
    throw error;
  }
}

// Catch-all handler: enviar el index.html para rutas del frontend (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
});