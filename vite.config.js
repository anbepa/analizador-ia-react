import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyConfigPath = './proxy.conf.json'
const proxyConfig = fs.existsSync(proxyConfigPath)
  ? JSON.parse(fs.readFileSync(proxyConfigPath, 'utf-8'))
  : {}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: proxyConfig
  }
})
