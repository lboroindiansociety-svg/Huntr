import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type TrackrFilters = {
  region: string
  industry: string
  season: string
  type: string
}

export const DEFAULT_TRACKR_FILTERS: TrackrFilters = {
  region: 'UK',
  industry: 'Tech',
  season: '2027',
  type: 'graduate-programmes',
}

type TrackrCompany = {
  id?: string
  name?: string
  careersSite?: string | null
  sponsorsVisa?: string | null
}

type TrackrProgramme = {
  id: string
  name: string
  companyId?: string | null
  url?: string | null
  categories?: string[] | null
  openingDate?: string | null
  closingDate?: string | null
  lastYearOpening?: string | null
  cv?: boolean | null
  coverLetter?: string | null
  writtenAnswers?: string | null
  company?: TrackrCompany | null
}

export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function isActiveTrackrProgramme(programme: TrackrProgramme): boolean {
  return !!(programme.url && programme.openingDate)
}

export function mapProgramme(programme: TrackrProgramme, filters: TrackrFilters) {
  const careersSite = programme.company?.careersSite ?? null
  const link = programme.url ?? careersSite

  return {
    trackr_id: programme.id,
    name: programme.name,
    company_id: programme.companyId ?? programme.company?.id ?? null,
    company_name: programme.company?.name ?? 'Unknown',
    company_domain: extractDomain(link),
    job_url: programme.url ?? null,
    careers_site: careersSite,
    region: filters.region,
    industry: filters.industry,
    season: filters.season,
    programme_type: filters.type,
    categories: programme.categories ?? [],
    opening_date: programme.openingDate ?? null,
    closing_date: programme.closingDate ?? null,
    last_year_opening: programme.lastYearOpening ?? null,
    cv_required: programme.cv ?? null,
    cover_letter: programme.coverLetter ?? null,
    written_answers: programme.writtenAnswers ?? null,
    sponsors_visa: programme.company?.sponsorsVisa ?? null,
    raw: programme,
    synced_at: new Date().toISOString(),
  }
}

export async function fetchTrackrProgrammes(filters: TrackrFilters): Promise<TrackrProgramme[]> {
  const params = new URLSearchParams({
    region: filters.region,
    industry: filters.industry,
    season: filters.season,
    type: filters.type,
  })

  const res = await fetch(`https://api.the-trackr.com/programmes?${params}`)
  if (!res.ok) {
    throw new Error(`Trackr API returned ${res.status}`)
  }

  const data = await res.json()
  if (!Array.isArray(data)) {
    throw new Error('Unexpected Trackr API response')
  }

  return data
}

export async function syncTrackrToSupabase(
  supabase: SupabaseClient,
  filters: TrackrFilters,
) {
  const programmes = await fetchTrackrProgrammes(filters)
  const rows = programmes
    .filter(isActiveTrackrProgramme)
    .map(p => mapProgramme(p, filters))

  const { error: deleteError } = await supabase
    .from('trackr_programmes')
    .delete()
    .eq('region', filters.region)
    .eq('industry', filters.industry)
    .eq('season', filters.season)
    .eq('programme_type', filters.type)
  if (deleteError) throw new Error(deleteError.message)

  if (rows.length > 0) {
    const { error } = await supabase.from('trackr_programmes').upsert(rows, {
      onConflict: 'trackr_id',
    })
    if (error) throw new Error(error.message)
  }

  const lastSyncedAt = new Date().toISOString()
  const { error: metaError } = await supabase.from('trackr_sync_meta').upsert({
    id: 'default',
    region: filters.region,
    industry: filters.industry,
    season: filters.season,
    programme_type: filters.type,
    last_synced_at: lastSyncedAt,
    programme_count: rows.length,
  })
  if (metaError) throw new Error(metaError.message)

  return { synced: rows.length, lastSyncedAt }
}

export function createServiceSupabase(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
