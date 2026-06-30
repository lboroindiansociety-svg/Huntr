export async function parseJobFromUrl(url, { pageText, signal } = {}) {
  const body = { url: url?.trim() || '' }
  if (pageText?.trim()) {
    body.pageText = pageText.trim()
  }

  if (!body.url && !body.pageText) {
    throw new Error('Provide a job posting URL')
  }

  if (import.meta.env.DEV) {
    const res = await fetch('/api/parse-job-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to parse job posting')
    return data
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase is not configured')
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/parse-job-url`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to parse job posting')
  return data
}
