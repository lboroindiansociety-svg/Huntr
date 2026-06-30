import { supabase } from './supabase'

export async function syncLiveRoles() {
  if (import.meta.env.DEV) {
    const res = await fetch('/api/live-roles-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to sync live roles')
    return data
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase is not configured')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/live-roles-sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to sync live roles')
  return data
}

export async function fetchCachedLiveRoles() {
  const { data, error } = await supabase
    .from('discover_roles')
    .select('*')
    .order('posted_at', { ascending: false, nullsFirst: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchLiveRolesSyncMeta() {
  const { data, error } = await supabase
    .from('discover_roles_sync_meta')
    .select('*')

  if (error) throw new Error(error.message)
  const map = {}
  for (const row of data || []) {
    map[row.source] = row
  }
  return map
}

export function resolveDiscoverLogoDomain(role) {
  const domain = role?.company_domain?.replace(/^www\./, '')
  const blocked = new Set([
    'adzuna.co.uk', 'adzuna.com', 'reed.co.uk',
    'indeed.com', 'linkedin.com', 'glassdoor.com', 'google.com',
  ])
  if (!domain || blocked.has(domain)) return null
  return domain
}

export function roleToSavePayload(role) {
  const lines = [`Source: ${role.source}`]
  if (role.location) lines.push(`Location: ${role.location}`)
  if (role.salary) lines.push(`Salary: ${role.salary}`)
  if (role.description) lines.push(role.description)

  return {
    company_name: role.company_name,
    company_domain: resolveDiscoverLogoDomain(role) || '',
    role: role.role,
    job_url: role.job_url,
    location_place: role.location || '',
    salary: role.salary || '',
    saved_notes: lines.join('\n'),
    location: 'remote',
    deadline: '',
    priority: 'medium',
    tags: [],
  }
}

export function isRoleSaved(role, internships) {
  return internships.some(item => {
    if (item.job_url && role.job_url && item.job_url === role.job_url) return true
    return (
      item.company_name?.toLowerCase() === role.company_name?.toLowerCase() &&
      item.role?.toLowerCase() === role.role?.toLowerCase()
    )
  })
}

export function liveRolesSubtitle(meta, roleCount) {
  const adzuna = meta?.adzuna?.last_synced_at
  const reed = meta?.reed?.last_synced_at
  const latest = [adzuna, reed].filter(Boolean).sort().pop()

  if (latest) {
    const parsed = new Date(latest)
    const label = Number.isNaN(parsed.getTime())
      ? latest
      : parsed.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    const parts = []
    if (meta?.adzuna?.role_count != null) parts.push(`${meta.adzuna.role_count} Adzuna`)
    if (meta?.reed?.role_count != null) parts.push(`${meta.reed.role_count} Reed`)
    const sources = parts.length ? ` (${parts.join(', ')})` : ''
    return `Last synced ${label} · ${roleCount} role${roleCount !== 1 ? 's' : ''} shown${sources}`
  }

  if (roleCount > 0) {
    return `${roleCount} role${roleCount !== 1 ? 's' : ''} shown`
  }

  return 'UK tech grad roles from Adzuna and Reed'
}
