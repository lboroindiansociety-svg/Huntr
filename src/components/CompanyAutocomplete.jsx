import { useEffect, useRef, useState } from 'react'
import { Building } from 'lucide-react'
import { Input } from './ui/input'
import { Spinner } from './ui/spinner'
import { cn } from '../lib/utils'
import { formatLogoUrl, getLogoUrl, searchCompanies } from '../lib/logoDev'

function CompanyAutocomplete({
  value,
  domain,
  onChange,
  placeholder = 'Google, Meta, ...',
  className,
  inputClassName,
  required,
}) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const abortRef = useRef(null)
  const skipSearchRef = useRef(false)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false
      return
    }

    const q = query.trim()
    if (!q) {
      setResults([])
      setSearchError(false)
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const data = await searchCompanies(q, controller.signal)
        setResults((data || []).slice(0, 6))
        setActive(0)
        setSearchError(false)
        setPreviewError(false)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setResults([])
          setSearchError(true)
        }
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setPreviewError(false)
  }, [domain])

  const select = (company) => {
    skipSearchRef.current = true
    setQuery(company.name)
    setOpen(false)
    setResults([])
    setPreviewError(false)
    onChange({ name: company.name, domain: company.domain })
  }

  const handleInputChange = (e) => {
    const next = e.target.value
    setQuery(next)
    setOpen(true)
    setPreviewError(false)
    onChange({ name: next, domain: '' })
  }

  const onKeyDown = (e) => {
    if (!(open && results.length)) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(i => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      select(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const previewUrl = domain
    ? getLogoUrl({ domain, size: 64 })
    : getLogoUrl({ name: query, size: 64 })

  const showDropdown = open && query.trim() && !searchError
  const showEmpty = showDropdown && !loading && results.length === 0

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        {previewUrl && !previewError ? (
          <img
            src={previewUrl}
            alt=""
            width={20}
            height={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded object-contain pointer-events-none"
            onError={() => setPreviewError(true)}
          />
        ) : (
          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          className={cn('pl-9 pr-9', inputClassName)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown && results.length > 0}
          aria-controls="company-listbox"
          aria-activedescendant={
            showDropdown && results.length > 0 ? `company-option-${active}` : undefined
          }
        />
        {loading && (
          <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <ul
          id="company-listbox"
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md"
        >
          {results.map((company, i) => (
            <li
              key={company.domain}
              id={`company-option-${i}`}
              role="option"
              aria-selected={i === active}
              className={cn(
                'flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm',
                i === active && 'bg-accent'
              )}
              onMouseDown={e => {
                e.preventDefault()
                select(company)
              }}
              onMouseEnter={() => setActive(i)}
            >
              <img
                src={formatLogoUrl(company.logo_url, 56) || getLogoUrl({ domain: company.domain, size: 56 })}
                alt=""
                width={28}
                height={28}
                loading="lazy"
                className="h-7 w-7 rounded-md object-contain flex-shrink-0"
              />
              <span className="font-medium truncate">{company.name}</span>
              <span className="ml-auto text-xs text-muted-foreground truncate max-w-[40%]">
                {company.domain}
              </span>
            </li>
          ))}
        </ul>
      )}

      {showEmpty && (
        <div
          role="status"
          className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover px-3 py-2.5 text-sm text-muted-foreground shadow-md"
        >
          No companies found — you can still enter a custom name
        </div>
      )}

      {searchError && query.trim() && (
        <p className="mt-1 text-xs text-muted-foreground">
          Search unavailable — logo preview still works while typing
        </p>
      )}
    </div>
  )
}

export default CompanyAutocomplete
