import { supabase } from './supabase'

export const DEFAULT_TRACKR_FILTERS = {
  region: 'UK',
  industry: 'Tech',
  season: '2027',
  type: 'graduate-programmes',
}

export const TRACKR_REGIONS = ['UK', 'US', 'EU']
export const TRACKR_INDUSTRIES = ['Tech', 'Finance', 'Law']
export const TRACKR_SEASONS = ['2025', '2026', '2027', '2028']

function normalizeFilters(filters = DEFAULT_TRACKR_FILTERS) {
  return {
    region: filters.region ?? DEFAULT_TRACKR_FILTERS.region,
    industry: filters.industry ?? DEFAULT_TRACKR_FILTERS.industry,
    season: filters.season ?? DEFAULT_TRACKR_FILTERS.season,
    type: filters.type ?? DEFAULT_TRACKR_FILTERS.type,
  }
}

export async function syncTrackrProgrammes(filters = DEFAULT_TRACKR_FILTERS) {
  const body = normalizeFilters(filters)

  if (import.meta.env.DEV) {
    const res = await fetch('/api/trackr-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to sync Trackr programmes')
    return data
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase is not configured')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/trackr-sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to sync Trackr programmes')
  return data
}

export function isActiveTrackrProgramme(programme) {
  return !!(programme?.job_url && programme?.opening_date)
}

export async function fetchCachedProgrammes(filters = DEFAULT_TRACKR_FILTERS) {
  const f = normalizeFilters(filters)

  const { data, error } = await supabase
    .from('trackr_programmes')
    .select('*')
    .eq('region', f.region)
    .eq('industry', f.industry)
    .eq('season', f.season)
    .eq('programme_type', f.type)
    .not('job_url', 'is', null)
    .not('opening_date', 'is', null)
    .order('company_name', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchSyncMeta() {
  const { data, error } = await supabase
    .from('trackr_sync_meta')
    .select('*')
    .eq('id', 'default')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export function buildProgrammeNotes(programme) {
  const lines = []
  if (programme.categories?.length) {
    lines.push(`Categories: ${programme.categories.join(', ')}`)
  }
  if (programme.cv_required != null) {
    lines.push(`CV required: ${programme.cv_required ? 'Yes' : 'No'}`)
  }
  if (programme.cover_letter) {
    lines.push(`Cover letter: ${programme.cover_letter}`)
  }
  if (programme.written_answers) {
    lines.push(`Written answers: ${programme.written_answers}`)
  }
  if (programme.sponsors_visa) {
    lines.push(`Visa sponsorship: ${programme.sponsors_visa}`)
  }
  if (programme.opening_date) {
    lines.push(`Opened: ${new Date(programme.opening_date).toLocaleDateString()}`)
  }
  if (programme.last_year_opening && !programme.opening_date) {
    lines.push(`Last year opened: ${new Date(programme.last_year_opening).toLocaleDateString()}`)
  }
  lines.push('Source: Trackr')
  return lines.join('\n')
}

export function programmeToSavePayload(programme) {
  const jobUrl = programme.job_url || programme.careers_site || ''
  const deadline = programme.closing_date
    ? programme.closing_date.slice(0, 10)
    : ''

  return {
    trackr_id: programme.trackr_id,
    company_name: programme.company_name,
    company_domain: programme.company_domain || '',
    role: programme.name,
    job_url: jobUrl,
    deadline,
    saved_notes: buildProgrammeNotes(programme),
    location: 'remote',
    location_place: '',
    salary: '',
    priority: 'medium',
    tags: [],
  }
}

export function isProgrammeSaved(programme, internships) {
  return internships.some(item => {
    if (programme.trackr_id && item.trackr_id === programme.trackr_id) return true
    return (
      item.company_name?.toLowerCase() === programme.company_name?.toLowerCase() &&
      item.role?.toLowerCase() === programme.name?.toLowerCase()
    )
  })
}

export function filtersMatchSyncMeta(filters, meta) {
  if (!meta?.last_synced_at) return false
  const f = normalizeFilters(filters)
  return (
    meta.region === f.region &&
    meta.industry === f.industry &&
    meta.season === f.season &&
    meta.programme_type === f.type
  )
}
