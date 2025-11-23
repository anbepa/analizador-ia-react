# Entornos

## Desarrollo local
1. Copia el archivo de ejemplo y ajusta tus credenciales:
   ```bash
   cp environments/.env.local.example .env.local
   ```
2. Asegúrate de que `local-api-server.js` lea `.env.local` (viene listo por defecto).
3. Inicia el proxy local y la app con los comandos descritos en el README principal.

## Producción en Vercel
1. En tu proyecto de Vercel, crea las variables de entorno desde el panel:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Opcionalmente puedes exportar `.env.vercel.example` para mantener una referencia local:
   ```bash
   cp environments/.env.vercel.example .env
   ```
3. Despliega; la función serverless `api/gemini-proxy.ts` usará `GEMINI_API_KEY` automáticamente.
