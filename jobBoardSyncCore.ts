import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const GRAD_TECH_QUERIES = [
  'graduate software engineer',
  'graduate developer',
  'new grad software',
  'early careers software engineer',
  'graduate software developer',
]

const ADZUNA_MAX_PAGES = 2
const ADZUNA_RESULTS_PER_PAGE = 50

export type DiscoverRoleRow = {
  external_id: string
  source: 'adzuna' | 'reed'
  company_name: string
  company_domain: string | null
  role: string
  job_url: string
  location: string | null
  salary: string | null
  description: string | null
  posted_at: string | null
  search_query: string
  synced_at: string
}

export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

const AGGREGATOR_DOMAINS = new Set([
  'adzuna.co.uk',
  'adzuna.com',
  'reed.co.uk',
  'indeed.com',
  'linkedin.com',
  'glassdoor.com',
  'google.com',
])

/** Job board URLs point at aggregators — use company name for logos instead. */
export function resolveLogoDomain(url: string | null | undefined): string | null {
  const domain = extractDomain(url)
  if (!domain || AGGREGATOR_DOMAINS.has(domain)) return null
  return domain
}

function parsePostedDate(value: string | null | undefined): string | null {
  if (!value?.trim()) return null

  const trimmed = value.trim()
  const dotNet = trimmed.match(/\/Date\((\d+)\)\//)
  if (dotNet) {
    const d = new Date(Number(dotNet[1]))
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }

  const uk = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (uk) {
    const [, day, month, year] = uk
    const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00.000Z`)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }

  const d = new Date(trimmed)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function formatSalary(min?: number | null, max?: number | null, currency = 'GBP'): string | null {
  if (min == null && max == null) return null
  const safeCurrency = currency?.trim() || 'GBP'
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: safeCurrency,
        maximumFractionDigits: 0,
      }).format(n)
    } catch {
      return `£${Math.round(n).toLocaleString('en-GB')}`
    }
  }
  if (min != null && max != null && min !== max) return `${fmt(min)} – ${fmt(max)}`
  return fmt(min ?? max!)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

type AdzunaJob = {
  id: string | number
  title?: string
  redirect_url?: string
  description?: string
  created?: string
  salary_min?: number
  salary_max?: number
  company?: { display_name?: string }
  location?: { display_name?: string }
}

type ReedJob = {
  jobId?: number
  jobTitle?: string
  employerName?: string
  jobUrl?: string
  locationName?: string
  minimumSalary?: number
  maximumSalary?: number
  currency?: string
  date?: string
  jobDescription?: string
}

function mapAdzunaJob(job: AdzunaJob, query: string): DiscoverRoleRow | null {
  if (!job.redirect_url || !job.title) return null
  const company = job.company?.display_name?.trim() || 'Unknown'
  return {
    external_id: String(job.id),
    source: 'adzuna',
    company_name: company,
    company_domain: null,
    role: job.title.trim(),
    job_url: job.redirect_url,
    location: job.location?.display_name ?? null,
    salary: formatSalary(job.salary_min, job.salary_max),
    description: job.description?.slice(0, 500) ?? null,
    posted_at: parsePostedDate(job.created),
    search_query: query,
    synced_at: new Date().toISOString(),
  }
}

function mapReedJob(job: ReedJob, query: string): DiscoverRoleRow | null {
  if (!job.jobUrl || !job.jobTitle) return null
  const company = job.employerName?.trim() || 'Unknown'
  return {
    external_id: String(job.jobId),
    source: 'reed',
    company_name: company,
    company_domain: null,
    role: job.jobTitle.trim(),
    job_url: job.jobUrl,
    location: job.locationName ?? null,
    salary: formatSalary(job.minimumSalary, job.maximumSalary, job.currency || 'GBP'),
    description: job.jobDescription?.replace(/<[^>]+>/g, ' ').slice(0, 500) ?? null,
    posted_at: parsePostedDate(job.date),
    search_query: query,
    synced_at: new Date().toISOString(),
  }
}

async function fetchAdzunaPage(
  appId: string,
  appKey: string,
  query: string,
  page: number,
): Promise<AdzunaJob[]> {
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: query,
    category: 'it-jobs',
    results_per_page: String(ADZUNA_RESULTS_PER_PAGE),
  })
  const res = await fetch(`https://api.adzuna.com/v1/api/jobs/gb/search/${page}?${params}`)
  if (!res.ok) {
    throw new Error(`Adzuna API returned ${res.status}`)
  }
  const data = await res.json() as { results?: AdzunaJob[] }
  return Array.isArray(data.results) ? data.results : []
}

async function fetchReedSearch(apiKey: string, query: string): Promise<ReedJob[]> {
  const params = new URLSearchParams({
    keywords: query,
    graduate: 'true',
    resultsToTake: '100',
  })
  const auth = Buffer.from(`${apiKey}:`).toString('base64')
  const res = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  if (!res.ok) {
    throw new Error(`Reed API returned ${res.status}`)
  }
  const data = await res.json() as { results?: ReedJob[] }
  return Array.isArray(data.results) ? data.results : []
}

export async function syncAdzunaRoles(
  supabase: SupabaseClient,
  appId: string,
  appKey: string,
) {
  const byKey = new Map<string, DiscoverRoleRow>()

  for (const query of GRAD_TECH_QUERIES) {
    for (let page = 1; page <= ADZUNA_MAX_PAGES; page++) {
      const results = await fetchAdzunaPage(appId, appKey, query, page)
      if (results.length === 0) break
      for (const job of results) {
        const row = mapAdzunaJob(job, query)
        if (row) byKey.set(`${row.source}:${row.external_id}`, row)
      }
      if (results.length < ADZUNA_RESULTS_PER_PAGE) break
    }
    await sleep(250)
  }

  const rows = [...byKey.values()]
  const lastSyncedAt = new Date().toISOString()

  const { error: deleteError } = await supabase
    .from('discover_roles')
    .delete()
    .eq('source', 'adzuna')
  if (deleteError) throw new Error(deleteError.message)

  if (rows.length > 0) {
    const { error } = await supabase.from('discover_roles').upsert(rows, {
      onConflict: 'source,external_id',
    })
    if (error) throw new Error(error.message)
  }

  const { error: metaError } = await supabase.from('discover_roles_sync_meta').upsert({
    source: 'adzuna',
    last_synced_at: lastSyncedAt,
    role_count: rows.length,
  })
  if (metaError) throw new Error(metaError.message)

  return { synced: rows.length, lastSyncedAt }
}

export async function syncReedRoles(supabase: SupabaseClient, apiKey: string) {
  const byKey = new Map<string, DiscoverRoleRow>()

  for (const query of GRAD_TECH_QUERIES) {
    const results = await fetchReedSearch(apiKey, query)
    for (const job of results) {
      const row = mapReedJob(job, query)
      if (row) byKey.set(`${row.source}:${row.external_id}`, row)
    }
    await sleep(250)
  }

  const rows = [...byKey.values()]
  const lastSyncedAt = new Date().toISOString()

  const { error: deleteError } = await supabase
    .from('discover_roles')
    .delete()
    .eq('source', 'reed')
  if (deleteError) throw new Error(deleteError.message)

  if (rows.length > 0) {
    const { error } = await supabase.from('discover_roles').upsert(rows, {
      onConflict: 'source,external_id',
    })
    if (error) throw new Error(error.message)
  }

  const { error: metaError } = await supabase.from('discover_roles_sync_meta').upsert({
    source: 'reed',
    last_synced_at: lastSyncedAt,
    role_count: rows.length,
  })
  if (metaError) throw new Error(metaError.message)

  return { synced: rows.length, lastSyncedAt }
}

export async function syncAllLiveRoles(
  supabase: SupabaseClient,
  appId: string,
  appKey: string,
  reedApiKey: string,
) {
  const adzuna = await syncAdzunaRoles(supabase, appId, appKey)
  const reed = await syncReedRoles(supabase, reedApiKey)
  return { adzuna, reed }
}

export function createServiceSupabase(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
