import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { execSync } from 'child_process'

function getGitCommit(): string {
  try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'unknown' }
}
import { extractJobDetails } from './parseJobCore'
import { createServiceSupabase, syncTrackrToSupabase, DEFAULT_TRACKR_FILTERS } from './trackrSyncCore'
import { syncAllLiveRoles } from './jobBoardSyncCore'

function readRequestBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function liveRolesSyncDevPlugin(
  supabaseUrl: string | undefined,
  serviceRoleKey: string | undefined,
  adzunaAppId: string | undefined,
  adzunaAppKey: string | undefined,
  reedApiKey: string | undefined,
) {
  return {
    name: 'live-roles-sync-dev',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/api/live-roles-sync', async (req, res, next) => {
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

        if (!supabaseUrl || !serviceRoleKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env for live roles sync in dev',
          }))
          return
        }

        if (!adzunaAppId || !adzunaAppKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Set ADZUNA_APP_ID and ADZUNA_APP_KEY in .env' }))
          return
        }

        if (!reedApiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Set REED_API_KEY in .env' }))
          return
        }

        try {
          const supabase = createServiceSupabase(supabaseUrl, serviceRoleKey)
          const result = await syncAllLiveRoles(supabase, adzunaAppId, adzunaAppKey, reedApiKey)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to sync live roles'
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: message }))
        }
      })
    },
  }
}

function trackrSyncDevPlugin(supabaseUrl: string | undefined, serviceRoleKey: string | undefined) {
  return {
    name: 'trackr-sync-dev',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/api/trackr-sync', async (req, res, next) => {
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

        if (!supabaseUrl || !serviceRoleKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env for Trackr sync in dev',
          }))
          return
        }

        try {
          const raw = await readRequestBody(req)
          const body = JSON.parse(raw || '{}')
          const filters = {
            region: typeof body.region === 'string' ? body.region : DEFAULT_TRACKR_FILTERS.region,
            industry: typeof body.industry === 'string' ? body.industry : DEFAULT_TRACKR_FILTERS.industry,
            season: typeof body.season === 'string' ? body.season : DEFAULT_TRACKR_FILTERS.season,
            type: typeof body.type === 'string' ? body.type : DEFAULT_TRACKR_FILTERS.type,
          }

          const supabase = createServiceSupabase(supabaseUrl, serviceRoleKey)
          const result = await syncTrackrToSupabase(supabase, filters)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to sync Trackr programmes'
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: message }))
        }
      })
    },
  }
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
    plugins: [
      react(),
      parseJobUrlDevPlugin(env.GEMINI_API_KEY, env.JINA_API_KEY),
      trackrSyncDevPlugin(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
      liveRolesSyncDevPlugin(
        env.VITE_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        env.ADZUNA_APP_ID,
        env.ADZUNA_APP_KEY,
        env.REED_API_KEY,
      ),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      __GIT_COMMIT__: JSON.stringify(getGitCommit()),
    },
    server: Object.keys(serverConfig).length ? serverConfig : undefined,
  }
})
