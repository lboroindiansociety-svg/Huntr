const PUBLISHABLE_KEY = import.meta.env.VITE_LOGO_DEV_PUBLISHABLE_KEY

export function getLogoUrl({ domain, name, size = 64 } = {}) {
  if (!PUBLISHABLE_KEY) return null

  const params = `token=${PUBLISHABLE_KEY}&format=webp&retina=true&size=${size}`

  if (domain) {
    return `https://img.logo.dev/${domain}?${params}`
  }

  const trimmed = name?.trim()
  if (trimmed) {
    return `https://img.logo.dev/name/${encodeURIComponent(trimmed)}?${params}`
  }

  return null
}

export function formatLogoUrl(logoUrl, size = 64) {
  if (!logoUrl) return null
  const separator = logoUrl.includes('?') ? '&' : '?'
  return `${logoUrl}${separator}format=webp&retina=true&size=${size}`
}

export async function searchCompanies(query, signal) {
  const q = query.trim()
  if (!q) return []

  const searchPath = `/api/company-search?q=${encodeURIComponent(q)}`

  if (import.meta.env.DEV) {
    const res = await fetch(searchPath, { signal })
    if (!res.ok) return []
    return res.json()
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return []

  const res = await fetch(
    `${supabaseUrl}/functions/v1/company-search?q=${encodeURIComponent(q)}`,
    {
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      signal,
    }
  )

  if (!res.ok) return []
  return res.json()
}
