import { useState } from 'react'
import { Link2, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { parseJobFromUrl } from '../lib/parseJobUrl'
import { searchCompanies } from '../lib/logoDev'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'

function isValidUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function JobUrlAutoFill({ onParsed, notesField = 'notes', variant = 'full', embedded = false, layout = 'inline' }) {
  const [url, setUrl] = useState('')
  const [pageText, setPageText] = useState('')
  const [showFallback, setShowFallback] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState(null)
  const compact = variant === 'compact'

  const handleAutoFill = async () => {
    setError(null)

    if (!isValidUrl(url) && !pageText.trim()) {
      setError('Enter a valid job posting URL')
      return
    }

    setParsing(true)
    try {
      const parsed = await parseJobFromUrl(url, {
        pageText: pageText.trim() || undefined,
      })

      if (!parsed.company_domain && parsed.company_name) {
        const companies = await searchCompanies(parsed.company_name)
        const match = companies.find(
          c => c.domain && c.name?.toLowerCase() === parsed.company_name.toLowerCase()
        ) || companies[0]
        if (match?.domain) {
          parsed.company_domain = match.domain
        }
      }

      const mapped = { ...parsed }
      if (notesField !== 'notes' && parsed.notes) {
        mapped[notesField] = parsed.notes
        delete mapped.notes
      }

      onParsed(mapped)
    } catch (err) {
      setError(err.message || 'Failed to parse job posting')
      if (!showFallback) setShowFallback(true)
    } finally {
      setParsing(false)
    }
  }

  const stacked = layout === 'stacked'

  const inputRow = stacked ? (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">Job posting URL</label>
        <div className="relative">
          <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAutoFill()}
            className="pl-10 h-11 text-base"
            placeholder="https://careers.company.com/jobs/software-engineer-intern"
            disabled={parsing}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Works with most company career pages, LinkedIn, Greenhouse, Lever, and more.
        </p>
      </div>
      <Button
        type="button"
        onClick={handleAutoFill}
        disabled={parsing || (!url.trim() && !pageText.trim())}
        className="gap-2 w-full h-11"
        size="lg"
      >
        {parsing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {parsing ? 'Analyzing posting…' : 'Extract & pre-fill'}
      </Button>
    </div>
  ) : (
    <div className={cn('flex gap-2', compact ? 'flex-1 min-w-0' : 'w-full')}>
      <div className="relative flex-1 min-w-0">
        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAutoFill()}
          className="pl-9"
          placeholder={compact ? 'Paste a job posting URL…' : 'https://careers.company.com/jobs/123'}
          disabled={parsing}
        />
      </div>
      <Button
        type="button"
        onClick={handleAutoFill}
        disabled={parsing || (!url.trim() && !pageText.trim())}
        className="gap-1.5 shrink-0"
        size={compact ? 'default' : 'default'}
      >
        {parsing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {parsing ? 'Analyzing…' : 'Auto-fill'}
      </Button>
    </div>
  )

  const fallbackToggle = (
    <button
      type="button"
      onClick={() => setShowFallback(v => !v)}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {showFallback ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      Link not working? Paste page text instead
    </button>
  )

  const fallbackTextarea = (
    <textarea
      value={pageText}
      onChange={e => setPageText(e.target.value)}
      rows={stacked ? 6 : showFallback ? (compact ? 3 : 4) : 4}
      disabled={parsing}
      className={cn(
        'w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground',
        stacked && 'min-h-[140px]'
      )}
      placeholder="Copy and paste the job description here if the link can't be fetched…"
    />
  )

  if (embedded && stacked) {
    return (
      <div className="space-y-8">
        {inputRow}
        <div className="space-y-4 pt-2 border-t border-border">
          {fallbackToggle}
          {showFallback && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Page text fallback</label>
              {fallbackTextarea}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
            {error}
          </p>
        )}
      </div>
    )
  }

  if (embedded) {
    return (
      <div className="space-y-3">
        {inputRow}
        {fallbackToggle}
        {showFallback && fallbackTextarea}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  if (compact) {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Auto-fill from link</span>
          </div>
          {inputRow}
        </div>

        {fallbackToggle}

        {showFallback && fallbackTextarea}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm font-medium">Auto-fill from job link</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Paste a link from a company careers page and AI will fill in the details for you.
      </p>

      {inputRow}

      {fallbackToggle}

      {showFallback && fallbackTextarea}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
