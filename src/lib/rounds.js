export const ROUND_TYPES = [
  { value: 'application', label: 'Application' },
  { value: 'oa', label: 'Online Assessment' },
  { value: 'phone', label: 'Phone Screen' },
  { value: 'technical', label: 'Technical' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'onsite', label: 'On-site' },
  { value: 'final', label: 'Final Round' },
  { value: 'other', label: 'Other' },
]

export const ROUND_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'skipped', label: 'Skipped' },
]

export const ROUND_TEMPLATES = [
  { name: 'Application Submitted', round_type: 'application', status: 'completed' },
  { name: 'Online Assessment', round_type: 'oa', status: 'pending' },
  { name: 'Phone Screen', round_type: 'phone', status: 'pending' },
  { name: 'Technical Interview', round_type: 'technical', status: 'pending' },
  { name: 'Final Round', round_type: 'final', status: 'pending' },
]

export function sortRounds(rounds) {
  return [...(rounds || [])].sort((a, b) => a.sort_order - b.sort_order)
}

export function deriveStatusFromRounds(rounds, currentStatus) {
  if (!rounds?.length) return currentStatus
  if (rounds.some(r => r.status === 'failed')) return 'rejected'
  if (rounds.some(r => ['scheduled', 'completed', 'passed'].includes(r.status))) {
    if (currentStatus === 'saved') return 'applied'
    if (['applied', 'saved'].includes(currentStatus)) return 'interviewing'
    return currentStatus
  }
  return currentStatus
}

export function shouldSyncInternshipStatus(currentStatus, derivedStatus) {
  if (currentStatus === 'offer') return false
  if (derivedStatus === 'rejected') return true
  if (derivedStatus === 'interviewing' && ['applied', 'saved'].includes(currentStatus)) return true
  return false
}

export function getCurrentRound(rounds) {
  const sorted = sortRounds(rounds)
  return sorted.find(r => ['scheduled', 'pending'].includes(r.status))
    || sorted.find(r => !['passed', 'completed', 'skipped', 'failed'].includes(r.status))
    || sorted[sorted.length - 1]
}

export function getNextScheduledRound(rounds) {
  const now = Date.now()
  return sortRounds(rounds).find(r =>
    r.status === 'scheduled' && r.scheduled_at && new Date(r.scheduled_at).getTime() >= now
  )
}

export function formatRoundDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  if (hasTime) {
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function toScheduledTimestamp(dateStr, timeStr) {
  if (!dateStr) return null
  const time = timeStr || '12:00'
  return new Date(`${dateStr}T${time}`).toISOString()
}

export function splitScheduledTimestamp(iso) {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return { date, time: time === '12:00' ? '' : time }
}

export function sanitizeRoundPayload(data) {
  const payload = { ...data }
  if ('scheduled_at' in payload && !payload.scheduled_at) payload.scheduled_at = null
  if ('completed_at' in payload && !payload.completed_at) payload.completed_at = null
  if ('notes' in payload && !payload.notes) payload.notes = null
  return payload
}
