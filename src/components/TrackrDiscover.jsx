import { useState, useEffect, useMemo } from 'react'
import {
  Search, X, RefreshCw, Loader2, Building2, Calendar,
} from 'lucide-react'
import DiscoverEntryCard from './DiscoverEntryCard'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select'
import Pagination from './Pagination'
import {
  DEFAULT_TRACKR_FILTERS,
  TRACKR_REGIONS,
  TRACKR_INDUSTRIES,
  TRACKR_SEASONS,
  syncTrackrProgrammes,
  fetchCachedProgrammes,
  fetchSyncMeta,
  programmeToSavePayload,
  isProgrammeSaved,
  filtersMatchSyncMeta,
} from '../lib/trackr'
import {
  syncLiveRoles,
  fetchCachedLiveRoles,
  fetchLiveRolesSyncMeta,
  roleToSavePayload,
  isRoleSaved,
  liveRolesSubtitle,
  resolveDiscoverLogoDomain,
} from '../lib/discoverRoles'

function formatDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function filterBySearch(items, searchTerm, fields) {
  const term = searchTerm.trim().toLowerCase()
  if (!term) return items
  return items.filter(item =>
    fields.some(fn => fn(item)?.toLowerCase().includes(term))
  )
}

function TrackrDiscover({ internships, onSaveProgramme, onError }) {
  const [filters, setFilters] = useState(DEFAULT_TRACKR_FILTERS)
  const [programmes, setProgrammes] = useState([])
  const [liveRoles, setLiveRoles] = useState([])
  const [trackrMeta, setTrackrMeta] = useState(null)
  const [liveMeta, setLiveMeta] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncingTrackr, setSyncingTrackr] = useState(false)
  const [syncingLive, setSyncingLive] = useState(false)
  const [programmesPage, setProgrammesPage] = useState(1)
  const [livePage, setLivePage] = useState(1)
  const [programmesPerPage, setProgrammesPerPage] = useState(12)
  const [livePerPage, setLivePerPage] = useState(12)

  const loadCached = async () => {
    setLoading(true)
    try {
      const [cachedProgrammes, cachedRoles, meta, rolesMeta] = await Promise.all([
        fetchCachedProgrammes(filters),
        fetchCachedLiveRoles(),
        fetchSyncMeta(),
        fetchLiveRolesSyncMeta(),
      ])
      setProgrammes(cachedProgrammes)
      setLiveRoles(cachedRoles)
      setTrackrMeta(meta)
      setLiveMeta(rolesMeta)
    } catch (err) {
      console.error('Error loading discover data:', err)
      onError?.(err.message || 'Failed to load discover data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCached()
    setProgrammesPage(1)
  }, [filters.region, filters.industry, filters.season])

  useEffect(() => {
    setProgrammesPage(1)
    setLivePage(1)
  }, [searchTerm])

  const handleSyncTrackr = async () => {
    setSyncingTrackr(true)
    try {
      const result = await syncTrackrProgrammes(filters)
      await loadCached()
      onError?.(`Synced ${result.synced} open programmes from Trackr`, 'success')
    } catch (err) {
      onError?.(err.message || 'Failed to sync from Trackr', 'error')
    } finally {
      setSyncingTrackr(false)
    }
  }

  const handleSyncLive = async () => {
    setSyncingLive(true)
    try {
      const result = await syncLiveRoles()
      await loadCached()
      onError?.(
        `Synced ${result.adzuna?.synced ?? 0} Adzuna + ${result.reed?.synced ?? 0} Reed roles`,
        'success',
      )
    } catch (err) {
      onError?.(err.message || 'Failed to sync live roles', 'error')
    } finally {
      setSyncingLive(false)
    }
  }

  const filteredProgrammes = useMemo(
    () => filterBySearch(programmes, searchTerm, [
      p => p.company_name,
      p => p.name,
      p => p.categories?.join(' '),
    ]),
    [programmes, searchTerm],
  )

  const filteredLiveRoles = useMemo(
    () => filterBySearch(liveRoles, searchTerm, [
      r => r.company_name,
      r => r.role,
      r => r.location,
      r => r.source,
    ]),
    [liveRoles, searchTerm],
  )

  const programmesPages = Math.max(1, Math.ceil(filteredProgrammes.length / programmesPerPage))
  const livePages = Math.max(1, Math.ceil(filteredLiveRoles.length / livePerPage))
  const paginatedProgrammes = filteredProgrammes.slice(
    (programmesPage - 1) * programmesPerPage,
    programmesPage * programmesPerPage,
  )
  const paginatedLive = filteredLiveRoles.slice(
    (livePage - 1) * livePerPage,
    livePage * livePerPage,
  )

  const filtersSynced = filtersMatchSyncMeta(filters, trackrMeta)
  const trackrSubtitle = trackrMeta?.last_synced_at && filtersSynced
    ? `Last synced ${formatDate(trackrMeta.last_synced_at)} · ${filteredProgrammes.length} open programme${filteredProgrammes.length !== 1 ? 's' : ''} shown`
    : filteredProgrammes.length > 0
      ? `${filteredProgrammes.length} open programme${filteredProgrammes.length !== 1 ? 's' : ''} shown`
      : 'Open graduate programmes with application links from Trackr'

  const liveSubtitle = liveRolesSubtitle(liveMeta, filteredLiveRoles.length)

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading discover...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search both sections..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 pr-9 h-9"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Programmes */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Programmes</h2>
            <p className="text-sm text-muted-foreground">{trackrSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Select value={filters.region} onValueChange={v => setFilter('region', v)}>
              <SelectTrigger className="h-9 w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRACKR_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.industry} onValueChange={v => setFilter('industry', v)}>
              <SelectTrigger className="h-9 w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRACKR_INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.season} onValueChange={v => setFilter('season', v)}>
              <SelectTrigger className="h-9 w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRACKR_SEASONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleSyncTrackr} disabled={syncingTrackr} className="gap-1.5">
              {syncingTrackr ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {syncingTrackr ? 'Syncing…' : 'Refresh Trackr'}
            </Button>
          </div>
        </div>

        {!filtersSynced && programmes.length === 0 && trackrMeta?.last_synced_at && (
          <EmptyCard
            title="No cached programmes for these filters"
            hint={`Refresh Trackr for ${filters.region} / ${filters.industry} / ${filters.season}.`}
          />
        )}
        {programmes.length === 0 && !trackrMeta?.last_synced_at && (
          <EmptyCard title="No programmes loaded yet" hint="Click Refresh Trackr to load open graduate programmes." />
        )}
        {filteredProgrammes.length === 0 && programmes.length > 0 && (
          <EmptyCard title="No programme matches" hint="Try a different search term." />
        )}

        {paginatedProgrammes.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedProgrammes.map(programme => {
                const saved = isProgrammeSaved(programme, internships)
                const badges = [
                  <Badge key="opened" variant="applied" className="text-[11px]">Opened</Badge>,
                  programme.closing_date && (
                    <Badge key="closes" variant="outline" className="text-[11px] gap-1">
                      <Calendar className="h-3 w-3" />
                      Closes {formatDate(programme.closing_date)}
                    </Badge>
                  ),
                  programme.sponsors_visa && (
                    <Badge key="visa" variant="outline" className="text-[11px]">
                      Visa: {programme.sponsors_visa}
                    </Badge>
                  ),
                  saved && (
                    <Badge key="saved" variant="saved" className="text-[11px]">Already saved</Badge>
                  ),
                ].filter(Boolean)

                return (
                  <DiscoverEntryCard
                    key={programme.trackr_id}
                    companyName={programme.company_name}
                    companyDomain={programme.company_domain}
                    role={programme.name}
                    badges={badges}
                    jobUrl={programme.job_url || programme.careers_site}
                    saved={saved}
                    onSave={() => onSaveProgramme(programmeToSavePayload(programme))}
                    body={(
                      <>
                        {programme.categories?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {programme.categories.map(cat => (
                              <Badge key={cat} variant="outline" className="text-[11px] font-normal">{cat}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground space-y-1">
                          {programme.cv_required != null && (
                            <p>CV: {programme.cv_required ? 'Required' : 'Not required'}</p>
                          )}
                          {programme.cover_letter && <p>Cover letter: {programme.cover_letter}</p>}
                          {programme.written_answers && <p>Written answers: {programme.written_answers}</p>}
                        </div>
                      </>
                    )}
                  />
                )
              })}
            </div>
            {filteredProgrammes.length > programmesPerPage && (
              <Pagination
                currentPage={programmesPage}
                totalPages={programmesPages}
                onPageChange={setProgrammesPage}
                itemsPerPage={programmesPerPage}
                onItemsPerPageChange={n => { setProgrammesPerPage(n); setProgrammesPage(1) }}
                totalItems={filteredProgrammes.length}
              />
            )}
          </>
        )}
      </section>

      {/* Live roles */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Live roles</h2>
            <p className="text-sm text-muted-foreground">{liveSubtitle}</p>
          </div>
          <Button size="sm" onClick={handleSyncLive} disabled={syncingLive} className="gap-1.5">
            {syncingLive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {syncingLive ? 'Syncing…' : 'Refresh live roles'}
          </Button>
        </div>

        {liveRoles.length === 0 && !liveMeta?.adzuna?.last_synced_at && !liveMeta?.reed?.last_synced_at && (
          <EmptyCard
            title="No live roles loaded yet"
            hint="Click Refresh live roles to search Adzuna and Reed for UK tech grad roles."
          />
        )}
        {filteredLiveRoles.length === 0 && liveRoles.length > 0 && (
          <EmptyCard title="No live role matches" hint="Try a different search term." />
        )}

        {paginatedLive.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedLive.map(role => {
                const saved = isRoleSaved(role, internships)
                const sourceLabel = role.source === 'adzuna' ? 'Adzuna' : 'Reed'
                const badges = [
                  <Badge key="source" variant="outline" className="text-[11px]">{sourceLabel}</Badge>,
                  role.posted_at && formatDate(role.posted_at) && (
                    <Badge key="posted" variant="outline" className="text-[11px]">
                      Posted {formatDate(role.posted_at)}
                    </Badge>
                  ),
                  saved && (
                    <Badge key="saved" variant="saved" className="text-[11px]">Already saved</Badge>
                  ),
                ].filter(Boolean)

                return (
                  <DiscoverEntryCard
                    key={`${role.source}:${role.external_id}`}
                    companyName={role.company_name}
                    companyDomain={resolveDiscoverLogoDomain(role)}
                    role={role.role}
                    badges={badges}
                    jobUrl={role.job_url}
                    saved={saved}
                    onSave={() => onSaveProgramme(roleToSavePayload(role))}
                    body={(
                      <div className="text-xs text-muted-foreground space-y-1">
                        {role.location && <p>{role.location}</p>}
                        {role.salary && <p>{role.salary}</p>}
                      </div>
                    )}
                  />
                )
              })}
            </div>
            {filteredLiveRoles.length > livePerPage && (
              <Pagination
                currentPage={livePage}
                totalPages={livePages}
                onPageChange={setLivePage}
                itemsPerPage={livePerPage}
                onItemsPerPageChange={n => { setLivePerPage(n); setLivePage(1) }}
                totalItems={filteredLiveRoles.length}
              />
            )}
          </>
        )}
      </section>
    </div>
  )
}

function EmptyCard({ title, hint }) {
  return (
    <Card className="py-12 text-center">
      <CardContent className="pt-0 flex flex-col items-center gap-3">
        <Building2 className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default TrackrDiscover
