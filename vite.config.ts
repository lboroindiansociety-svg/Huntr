import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { extractJobDetails } from './parseJobCore'

function readRequestBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function parseJobUrlDevPlugin(geminiKey: string | undefined, jinaKey: string | undefined) {
  return {
    name: 'parse-job-url-dev',
    configureServer(server: import('vite').ViteDevServer) {
      if (!geminiKey) return

      server.middlewares.use('/api/parse-job-url', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const raw = await readRequestBody(req)
          const body = JSON.parse(raw || '{}')
          const url = typeof body.url === 'string' ? body.url.trim() : ''
          const pageText = typeof body.pageText === 'string' ? body.pageText.trim() : ''

          if (!url && !pageText) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Provide a job posting URL or page text' }))
            return
          }

          if (url) {
            try {
              new URL(url)
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid URL' }))
              return
            }
          }

          const result = await extractJobDetails({
            url,
            pageText,
            apiKey: geminiKey,
            jinaApiKey: jinaKey,
          })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to parse job posting'
          res.statusCode = 422
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: message }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const serverConfig: import('vite').UserConfig['server'] = {}

  if (env.LOGO_DEV_SECRET_KEY) {
    serverConfig.proxy = {
      '/api/company-search': {
        target: 'https://api.logo.dev',
        changeOrigin: true,
        rewrite: (path) => {
          const query = path.split('?')[1] || ''
          return `/search${query ? `?${query}` : ''}`
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', `Bearer ${env.LOGO_DEV_SECRET_KEY}`)
          })
        },
      },
    }
  }

  return {
    plugins: [react(), parseJobUrlDevPlugin(env.GEMINI_API_KEY, env.JINA_API_KEY)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: Object.keys(serverConfig).length ? serverConfig : undefined,
  }
})
