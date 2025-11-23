/* eslint-env node */
/* global process */
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

require('dotenv').config({ path: '.env.local', override: true })
const express = require('express')
const cors = require('cors')

let GoogleGenerativeAI
try {
  ;({ GoogleGenerativeAI } = require('@google/generative-ai'))
} catch (error) {
  console.warn('[WARN] @google/generative-ai no está instalado. Usando una implementación mínima con fetch.', error?.message)

  GoogleGenerativeAI = class {
    constructor(apiKey) {
      this.apiKey = apiKey
    }

    getGenerativeModel({ model }) {
      return {
        generateContent: async ({ contents, generationConfig }) => {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${this.apiKey}`

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig }),
          })

          if (!response.ok) {
            const errorBody = await response.json().catch(() => null)
            const message = errorBody?.error?.message || 'Error al llamar a Gemini'
            const err = new Error(message)
            err.details = errorBody
            throw err
          }

          const data = await response.json()
          return { response: data }
        },
      }
    }
  }
}

const app = express()
const PORT = process.env.PORT || 3000
const BODY_LIMIT = process.env.GEMINI_PROXY_BODY_LIMIT || '512mb'

app.use(cors())
app.use(express.json({ limit: BODY_LIMIT }))
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }))

app.post('/api/gemini-proxy', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error('[ERROR] GEMINI_API_KEY no configurada en .env.local')
      return res.status(500).json({
        error: 'GEMINI_API_KEY not configured',
        message: 'Configure GEMINI_API_KEY en .env.local',
      })
    }

    const { payload } = req.body
    const { contents, generationConfig } = payload || req.body

    console.log(`[API] Gemini API call received (action: ${req.body.action || 'direct'})`)

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent({
      contents,
      generationConfig,
    })

    console.log('[SUCCESS] Gemini response successful')
    res.status(200).json(result.response)
  } catch (error) {
    console.error('[ERROR] Gemini API error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    console.error('[ERROR] Payload too large for Gemini proxy', err.message)
    return res.status(413).json({
      error: 'Payload too large',
      message: 'El payload excede el límite permitido. Reduce el tamaño o cantidad de imágenes y vuelve a intentarlo.'
    })
  }
  return next(err)
})

app.listen(PORT, () => {
  console.log(`\n[SERVER] Local API server running on http://localhost:${PORT}`)
  console.log(`[ENDPOINT] http://localhost:${PORT}/api/gemini-proxy`)
  console.log(`[API_KEY] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing'}\n`)
})
