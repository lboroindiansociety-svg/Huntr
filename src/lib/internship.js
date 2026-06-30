const DATE_FIELDS = ['applied_date', 'deadline', 'saved_date']

export function sanitizeInternshipData(data) {
  const sanitized = { ...data }
  for (const field of DATE_FIELDS) {
    if (field in sanitized && !sanitized[field]) {
      sanitized[field] = null
    }
  }
  if ('company_domain' in sanitized && !sanitized.company_domain) {
    sanitized.company_domain = null
  }
  if ('job_url' in sanitized && !sanitized.job_url) {
    sanitized.job_url = null
  }
  if ('trackr_id' in sanitized && !sanitized.trackr_id) {
    sanitized.trackr_id = null
  }
  return sanitized
}
