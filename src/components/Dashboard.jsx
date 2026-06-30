import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Analytics from './Analytics'
import InternshipList from './InternshipList'
import TableView from './TableView'
import AddInternshipModal from './AddInternshipModal'
import EditInternshipModal from './EditInternshipModal'
import SaveInternshipModal from './SaveInternshipModal'
import ExportData from './ExportData'
import DatabaseSetup from './DatabaseSetup'
import Toast from './Toast'
import Pagination from './Pagination'
import ImportJobLinkModal from './ImportJobLinkModal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Separator } from './ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  Plus, Search, X, Filter, RotateCcw, Tag, Move,
  LayoutGrid, TableIcon, AlertTriangle, Bookmark,
  ChevronDown, SlidersHorizontal, Download, Loader2, Sparkles, FlaskConical,
  ArrowUpDown,
} from 'lucide-react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import { sanitizeInternshipData } from '../lib/internship'
import {
  deriveStatusFromRounds, shouldSyncInternshipStatus, sanitizeRoundPayload,
  sortRounds, ROUND_TEMPLATES,
} from '../lib/rounds'
import { getDevTestApplications, isDevEnvironment } from '../lib/devTestData'

const STATUS_OPTIONS = [
  { value: 'all',          label: 'All Statuses' },
  { value: 'saved',        label: 'Saved' },
  { value: 'applied',      label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer',        label: 'Offer' },
  { value: 'rejected',     label: 'Rejected' },
]

const LOCATION_OPTIONS = [
  { value: 'all',     label: 'All Locations' },
  { value: 'remote',  label: 'Remote' },
  { value: 'on-site', label: 'On-site' },
  { value: 'hybrid',  label: 'Hybrid' },
]

const SORT_OPTIONS = [
  { value: 'newest',        label: 'Newest added' },
  { value: 'oldest',        label: 'Oldest added' },
  { value: 'company-asc',   label: 'Company A–Z' },
  { value: 'company-desc',  label: 'Company Z–A' },
  { value: 'applied-desc',  label: 'Recently applied' },
  { value: 'applied-asc',   label: 'Earliest applied' },
  { value: 'deadline-asc',  label: 'Deadline (soonest)' },
  { value: 'deadline-desc', label: 'Deadline (latest)' },
  { value: 'status',        label: 'Status' },
]

const STATUS_SORT_ORDER = { saved: 0, applied: 1, interviewing: 2, offer: 3, rejected: 4 }

function sortInternships(list, sortBy) {
  const sorted = [...list]
  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at)
      case 'company-asc':
        return a.company_name.localeCompare(b.company_name)
      case 'company-desc':
        return b.company_name.localeCompare(a.company_name)
      case 'applied-desc': {
        const da = a.applied_date ? new Date(a.applied_date).getTime() : 0
        const db = b.applied_date ? new Date(b.applied_date).getTime() : 0
        return db - da
      }
      case 'applied-asc': {
        const da = a.applied_date ? new Date(a.applied_date).getTime() : Infinity
        const db = b.applied_date ? new Date(b.applied_date).getTime() : Infinity
        return da - db
      }
      case 'deadline-asc': {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity
        return da - db
      }
      case 'deadline-desc': {
        const da = a.deadline ? new Date(a.deadline).getTime() : 0
        const db = b.deadline ? new Date(b.deadline).getTime() : 0
        return db - da
      }
      case 'status':
        return (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99)
      case 'newest':
      default:
        return new Date(b.created_at) - new Date(a.created_at)
    }
  })
  return sorted
}

function Dashboard({ user }) {
  const [internships, setInternships] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalInitialData, setAddModalInitialData] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [selectedTags, setSelectedTags] = useState([])
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [showAddTagModal, setShowAddTagModal] = useState(false)
  const [newTag, setNewTag] = useState({ name: '', color: '#6b7280' })
  const [customTags, setCustomTags] = useState([])
  const [deleteTagConfirm, setDeleteTagConfirm] = useState(null)
  const [dragMode, setDragMode] = useState(false)
  const [viewMode, setViewMode] = useState(localStorage.getItem('defaultView') || 'card')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(localStorage.getItem('itemsPerPage')) || 10)
  const [activeTab, setActiveTab] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [seedingTestData, setSeedingTestData] = useState(false)
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('internshipSort') || 'newest')
  const [roundSaving, setRoundSaving] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

  const predefinedTags = [
    { name: 'Dream Company', color: '#ef4444' },
    { name: 'Priority',      color: '#f59e0b' },
    { name: 'Tech',          color: '#3b82f6' },
    { name: 'Finance',       color: '#10b981' },
    { name: 'Remote',        color: '#8b5cf6' },
    { name: 'Startup',       color: '#ec4899' },
  ]

  useEffect(() => { fetchInternships(); fetchCustomTags() }, [user])
  useEffect(() => { const v = localStorage.getItem('defaultView'); if (v) setViewMode(v) }, [])
  useEffect(() => { setCurrentPage(1) }, [searchTerm, statusFilter, locationFilter, selectedTags, activeTab, sortBy])
  useEffect(() => {
    localStorage.setItem('internshipSort', sortBy)
  }, [sortBy])
  useEffect(() => {
    const handler = (e) => { if (e.detail.defaultView) setViewMode(e.detail.defaultView) }
    window.addEventListener('settingsUpdated', handler)
    return () => window.removeEventListener('settingsUpdated', handler)
  }, [])

  const normalizeInternships = (rows) =>
    (rows || []).map(row => ({
      ...row,
      application_rounds: sortRounds(row.application_rounds),
    }))

  const fetchInternships = async () => {
    const minLoadMs = Math.random() * 2000 + 500
    const startedAt = Date.now()
    try {
      let { data, error } = await supabase
        .from('internships')
        .select('*, application_rounds(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error?.code === 'PGRST200' || error?.message?.includes('application_rounds')) {
        const fallback = await supabase
          .from('internships')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        data = fallback.data
        error = fallback.error
      }

      if (error) {
        if (error.code === '42P01') setShowDatabaseSetup(true)
        else console.error('Error fetching internships:', error)
      } else {
        setInternships(normalizeInternships(data))
      }
    } catch (err) {
      console.error('Error fetching internships:', err)
    } finally {
      const remaining = minLoadMs - (Date.now() - startedAt)
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining))
      }
      setLoading(false)
    }
  }

  const syncStatusAfterRoundChange = async (internshipId) => {
    const { data } = await supabase
      .from('internships')
      .select('*, application_rounds(*)')
      .eq('id', internshipId)
      .eq('user_id', user.id)
      .single()
    if (!data?.application_rounds?.length) return
    const derived = deriveStatusFromRounds(sortRounds(data.application_rounds), data.status)
    if (shouldSyncInternshipStatus(data.status, derived)) {
      await supabase.from('internships').update({ status: derived }).eq('id', internshipId).eq('user_id', user.id)
    }
  }

  const addApplicationRound = async (internshipId, roundData) => {
    setRoundSaving(internshipId)
    try {
      const internship = internships.find(i => i.id === internshipId)
      const sortOrder = internship?.application_rounds?.length || 0
      const { error } = await supabase.from('application_rounds').insert([{
        ...sanitizeRoundPayload(roundData),
        internship_id: internshipId,
        user_id: user.id,
        sort_order: sortOrder,
      }])
      if (error) { showToast('Error adding round.', 'error'); return }
      await syncStatusAfterRoundChange(internshipId)
      await fetchInternships()
    } finally {
      setRoundSaving(null)
    }
  }

  const updateApplicationRound = async (roundId, updates, internshipId) => {
    setRoundSaving(internshipId)
    try {
      const { error } = await supabase
        .from('application_rounds')
        .update(sanitizeRoundPayload(updates))
        .eq('id', roundId)
        .eq('user_id', user.id)
      if (error) { showToast('Error updating round.', 'error'); return }
      await syncStatusAfterRoundChange(internshipId)
      await fetchInternships()
    } finally {
      setRoundSaving(null)
    }
  }

  const deleteApplicationRound = async (roundId, internshipId) => {
    setRoundSaving(internshipId)
    try {
      const { error } = await supabase
        .from('application_rounds')
        .delete()
        .eq('id', roundId)
        .eq('user_id', user.id)
      if (error) { showToast('Error deleting round.', 'error'); return }
      await fetchInternships()
    } finally {
      setRoundSaving(null)
    }
  }

  const moveApplicationRound = async (internshipId, roundId, direction) => {
    const internship = internships.find(i => i.id === internshipId)
    if (!internship) return
    const rounds = sortRounds(internship.application_rounds)
    const idx = rounds.findIndex(r => r.id === roundId)
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= rounds.length) return

    setRoundSaving(internshipId)
    try {
      const a = rounds[idx]
      const b = rounds[swapIdx]
      await Promise.all([
        supabase.from('application_rounds').update({ sort_order: b.sort_order }).eq('id', a.id).eq('user_id', user.id),
        supabase.from('application_rounds').update({ sort_order: a.sort_order }).eq('id', b.id).eq('user_id', user.id),
      ])
      await fetchInternships()
    } finally {
      setRoundSaving(null)
    }
  }

  const addRoundTemplate = async (internshipId) => {
    setRoundSaving(internshipId)
    try {
      const internship = internships.find(i => i.id === internshipId)
      let sortOrder = internship?.application_rounds?.length || 0
      for (const template of ROUND_TEMPLATES) {
        const { error } = await supabase.from('application_rounds').insert([{
          ...template,
          internship_id: internshipId,
          user_id: user.id,
          sort_order: sortOrder++,
        }])
        if (error) { showToast('Error adding pipeline.', 'error'); return }
      }
      await syncStatusAfterRoundChange(internshipId)
      await fetchInternships()
    } finally {
      setRoundSaving(null)
    }
  }

  const roundHandlers = {
    onAddRound: (internshipId, data) => addApplicationRound(internshipId, data),
    onUpdateRound: (internshipId, roundId, updates) => updateApplicationRound(roundId, updates, internshipId),
    onDeleteRound: (internshipId, roundId) => deleteApplicationRound(roundId, internshipId),
    onMoveRound: (internshipId, roundId, dir) => moveApplicationRound(internshipId, roundId, dir),
    onAddTemplate: (internshipId) => addRoundTemplate(internshipId),
    roundSaving,
  }

  const addInternship = async (data) => {
    const { error } = await supabase.from('internships').insert([{ ...sanitizeInternshipData(data), user_id: user.id }])
    if (error) { showToast('Error adding internship.', 'error'); return }
    await fetchInternships()
    showToast('Internship added!')
    setShowAddModal(false)
  }

  const saveInternship = async (data) => {
    const { error } = await supabase.from('internships').insert([{ ...sanitizeInternshipData(data), user_id: user.id }])
    if (error) { showToast('Error saving internship.', 'error'); return }
    await fetchInternships()
    showToast('Internship saved!')
    setShowSaveModal(false)
  }

  const updateInternship = async (id, updates) => {
    const { error } = await supabase
      .from('internships').update(sanitizeInternshipData(updates)).eq('id', id).eq('user_id', user.id)
    if (error) { showToast('Error updating internship.', 'error'); return }
    await fetchInternships()
    showToast('Updated!')
  }

  const deleteInternship = async (id) => {
    const { error } = await supabase
      .from('internships').delete().eq('id', id).eq('user_id', user.id)
    if (error) { showToast('Error deleting internship.', 'error'); return }
    await fetchInternships()
    showToast('Deleted!')
  }

  const markAsApplied = async (id) => {
    const { error } = await supabase
      .from('internships')
      .update({ status: 'applied', applied_date: new Date().toISOString().split('T')[0] })
      .eq('id', id)
    if (error) { showToast('Error updating status.', 'error'); return }
    await fetchInternships()
    showToast('Marked as applied!')
  }

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setInternships(items => {
        const oldIdx = items.findIndex(i => i.id === active.id)
        const newIdx = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIdx, newIdx)
      })
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const seedTestApplications = async () => {
    setSeedingTestData(true)
    try {
      const rows = getDevTestApplications().map(data => ({
        ...sanitizeInternshipData(data),
        user_id: user.id,
      }))
      const { error } = await supabase.from('internships').insert(rows)
      if (error) {
        showToast('Failed to seed test data.', 'error')
        return
      }
      await fetchInternships()
      showToast('Added 15 grad-role test applications!')
    } catch (err) {
      console.error('Error seeding test data:', err)
      showToast('Failed to seed test data.', 'error')
    } finally {
      setSeedingTestData(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setLocationFilter('all')
    setSelectedTags([])
  }

  const toggleTag = (name) => {
    setSelectedTags(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    )
  }

  const addTag = async () => {
    if (!newTag.name.trim()) return
    if (customTags.find(t => t.name.toLowerCase() === newTag.name.trim().toLowerCase())) {
      showToast('Tag already exists', 'error')
      return
    }
    const { error } = await supabase
      .from('tags').insert([{ name: newTag.name.trim(), color: newTag.color, user_id: user.id }])
    if (error) { showToast('Failed to add tag.', 'error'); return }
    showToast('Tag added!')
    setShowAddTagModal(false)
    setNewTag({ name: '', color: '#6b7280' })
    fetchCustomTags()
  }

  const deleteTag = async (name) => {
    const toUpdate = internships.filter(i => i.tags?.includes(name))
    for (const i of toUpdate) {
      await supabase.from('internships').update({ tags: i.tags.filter(t => t !== name) }).eq('id', i.id)
    }
    const { error } = await supabase.from('tags').delete().eq('name', name).eq('user_id', user.id)
    if (error) { showToast('Error deleting tag.', 'error'); return }
    setSelectedTags(prev => prev.filter(t => t !== name))
    setDeleteTagConfirm(null)
    await fetchInternships()
    fetchCustomTags()
    showToast(`Tag "${name}" deleted`)
  }

  const fetchCustomTags = async () => {
    const { data, error } = await supabase.from('tags').select('*').eq('user_id', user.id).order('name')
    if (error) { console.error('Error fetching tags:', error); return }
    const unique = [...new Map((data || []).map(t => [t.name, t])).values()]
    setCustomTags(unique)
    if (!data || data.length === 0) {
      await supabase.from('tags').insert(predefinedTags.map(t => ({ ...t, user_id: user.id })))
      const { data: refreshed } = await supabase.from('tags').select('*').eq('user_id', user.id).order('name')
      const uniqueRefreshed = [...new Map((refreshed || []).map(t => [t.name, t])).values()]
      setCustomTags(uniqueRefreshed)
    }
  }

  const filteredInternships = internships.filter(i => {
    const matchesSearch = i.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter
    const matchesLocation = locationFilter === 'all' || i.location === locationFilter
    const matchesTags = selectedTags.length === 0 || selectedTags.every(t => i.tags?.includes(t))
    const matchesTab = activeTab === 'all' || i.status === activeTab
    return matchesSearch && matchesStatus && matchesLocation && matchesTags && matchesTab
  })

  const sortedInternships = dragMode
    ? filteredInternships
    : sortInternships(filteredInternships, sortBy)

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || locationFilter !== 'all' || selectedTags.length > 0
  const totalPages = Math.ceil(sortedInternships.length / itemsPerPage)
  const paginated = sortedInternships.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const tabCounts = {
    all:    internships.length,
    saved:  internships.filter(i => i.status === 'saved').length,
    active: internships.filter(i => ['applied','interviewing','offer'].includes(i.status)).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading your applications...</p>
        </div>
      </div>
    )
  }

  const renderList = (items) => {
    const listProps = {
      internships: items,
      onUpdate: updateInternship,
      onDelete: deleteInternship,
      onMarkAsApplied: markAsApplied,
      dragMode,
      ...roundHandlers,
    }
    if (dragMode) {
      return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {viewMode === 'card'
              ? <InternshipList {...listProps} />
              : <TableView {...listProps} />
            }
          </SortableContext>
        </DndContext>
      )
    }
    return viewMode === 'card'
      ? <InternshipList {...listProps} />
      : <TableView {...listProps} />
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6">
        {/* Analytics + pipeline intel */}
        <Analytics internships={internships} />
      </div>

      <Separator className="w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 space-y-6">
      {/* Header Row */}
      <div>
        <h2 className="text-xl font-semibold">Applications</h2>
        <p className="text-sm text-muted-foreground">
          {filteredInternships.length} of {internships.length} shown
        </p>
      </div>

      {/* Tab Bar + primary actions */}
      <div className="flex items-center justify-between gap-4 border-b border-border">
        <div className="flex items-center gap-1">
          {[
            { key: 'all',    label: 'All' },
            { key: 'saved',  label: 'Saved' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {label}
              <span className={cn(
                'ml-2 text-xs px-1.5 py-0.5 rounded-full tabular-nums',
                activeTab === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {key === 'saved' ? tabCounts.saved : tabCounts.all}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 pb-2 flex-wrap justify-end">
          {isDevEnvironment && (
            <Button
              size="sm"
              variant="outline"
              onClick={seedTestApplications}
              disabled={seedingTestData}
              className="gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
            >
              {seedingTestData
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <FlaskConical className="h-3.5 w-3.5" />
              }
              {seedingTestData ? 'Seeding…' : 'Test data'}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowSaveModal(true)} className="gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowImportModal(true)} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Import link
          </Button>
          <Button size="sm" onClick={() => { setAddModalInitialData(null); setShowAddModal(true) }} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Search + filters + view tools */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies or roles..."
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
          <div className="flex items-center rounded-lg border border-border overflow-hidden h-9">
            <button
              onClick={() => setViewMode('card')}
              className={cn(
                'px-2.5 h-full transition-colors',
                viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
              aria-label="Card view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'px-2.5 h-full transition-colors',
                viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
              aria-label="Table view"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={dragMode}
                className={cn('gap-1.5 h-9', sortBy !== 'newest' && 'bg-muted')}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                {SORT_OPTIONS.map(({ value, label }) => (
                  <DropdownMenuRadioItem key={value} value={value} className="cursor-pointer">
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(v => !v)}
              className={cn('gap-1.5 h-9', showFilters && 'bg-muted')}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 h-9 text-muted-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
            <Button
              variant={dragMode ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setDragMode(v => !v)}
              className="gap-1.5 h-9"
            >
              <Move className="h-3.5 w-3.5" />
              {dragMode ? 'Done' : 'Reorder'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowExport(true)} className="gap-1.5 h-9">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="pt-4 pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tag Filters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />
                    Filter by tags
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddTagModal(true)}
                    className="h-6 px-2 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add tag
                  </Button>
                </div>
                {customTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {customTags.map(tag => (
                      <div key={tag.name} className="relative group">
                        <button
                          onClick={() => toggleTag(tag.name)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                          style={{
                            backgroundColor: selectedTags.includes(tag.name) ? tag.color : `${tag.color}20`,
                            color: selectedTags.includes(tag.name) ? 'white' : tag.color,
                            border: `1px solid ${tag.color}40`,
                          }}
                        >
                          {tag.name}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTagConfirm(tag.name) }}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-2 w-2 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* List */}
      {renderList(paginated)}

      {/* Pagination */}
      {filteredInternships.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(n) => {
            setItemsPerPage(n)
            setCurrentPage(1)
            localStorage.setItem('itemsPerPage', n.toString())
          }}
          totalItems={filteredInternships.length}
        />
      )}

      {/* Modals */}
      <ImportJobLinkModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onParsed={parsed => {
          setAddModalInitialData(parsed)
          setShowAddModal(true)
        }}
      />
      {showAddModal && (
        <AddInternshipModal
          initialData={addModalInitialData}
          onClose={() => { setShowAddModal(false); setAddModalInitialData(null) }}
          onAdd={addInternship}
        />
      )}
      {showSaveModal && (
        <SaveInternshipModal onClose={() => setShowSaveModal(false)} onSave={saveInternship} />
      )}
      {showExport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <ExportData internships={internships} user={user} />
            <div className="flex justify-end mt-3">
              <Button variant="outline" onClick={() => setShowExport(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      {showDatabaseSetup && (
        <DatabaseSetup onClose={() => setShowDatabaseSetup(false)} />
      )}

      {/* Add Tag Dialog */}
      <Dialog open={showAddTagModal} onOpenChange={open => { if (!open) { setShowAddTagModal(false); setNewTag({ name: '', color: '#6b7280' }) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Custom Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tag Name</label>
              <Input
                value={newTag.name}
                onChange={e => setNewTag({ ...newTag, name: e.target.value })}
                placeholder="e.g. Dream Company"
                onKeyDown={e => e.key === 'Enter' && addTag()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newTag.color}
                  onChange={e => setNewTag({ ...newTag, color: e.target.value })}
                  className="h-9 w-16 rounded-lg border border-input cursor-pointer"
                />
                <div
                  className="flex-1 h-9 rounded-lg border flex items-center px-3 text-sm font-medium"
                  style={{ backgroundColor: `${newTag.color}20`, color: newTag.color, borderColor: `${newTag.color}40` }}
                >
                  {newTag.name || 'Preview'}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddTagModal(false); setNewTag({ name: '', color: '#6b7280' }) }}>
              Cancel
            </Button>
            <Button onClick={addTag} disabled={!newTag.name.trim()}>
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Dialog */}
      <Dialog open={!!deleteTagConfirm} onOpenChange={open => { if (!open) setDeleteTagConfirm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Tag
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Delete <span className="font-semibold text-foreground">"{deleteTagConfirm}"</span> from all applications? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTagConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTag(deleteTagConfirm)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast
        message={toast.message}
        isVisible={toast.show}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
      </div>
    </>
  )
}

export default Dashboard
