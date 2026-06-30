import { useState, useEffect } from 'react'
import { MapPin, FileText, Tag, DollarSign, Loader2, Bookmark, Link2 } from 'lucide-react'
import CompanyAutocomplete from './CompanyAutocomplete'
import JobUrlAutoFill from './JobUrlAutoFill'
import { supabase } from '../lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { DatePicker } from './ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

function SaveInternshipModal({ onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    company_name: '',
    company_domain: '',
    role: '',
    location: 'remote',
    location_place: '',
    deadline: '',
    salary: '',
    saved_notes: '',
    job_url: '',
    priority: 'medium',
    tags: [],
    trackr_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [availableTags, setAvailableTags] = useState([])

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        tags: initialData.tags || prev.tags,
      }))
    }
  }, [initialData])

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('tags').select('*').order('name')
      const unique = [...new Map((data || []).map(t => [t.name, t])).values()]
      setAvailableTags(unique)
    }
    fetch()
  }, [])

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const toggleTag = (name) => {
    set('tags', formData.tags.includes(name)
      ? formData.tags.filter(t => t !== name)
      : [...formData.tags, name]
    )
  }

  const handleSubmit = async () => {
    if (!formData.company_name.trim() || !formData.role.trim()) return
    setLoading(true)
    try {
      await onSave({
        ...formData,
        status: 'saved',
        saved_date: new Date().toISOString(),
        files: [],
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = formData.company_name.trim() && formData.role.trim()

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Save for Later
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1.5 py-0.5">
          <JobUrlAutoFill
            notesField="saved_notes"
            onParsed={parsed => setFormData(prev => ({
              ...prev,
              ...parsed,
              saved_notes: parsed.saved_notes || parsed.notes || prev.saved_notes,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Company Name *</label>
              <CompanyAutocomplete
                value={formData.company_name}
                domain={formData.company_domain}
                onChange={({ name, domain }) => setFormData(prev => ({
                  ...prev,
                  company_name: name,
                  company_domain: domain || '',
                }))}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Role *</label>
              <Input value={formData.role} onChange={e => set('role', e.target.value)} placeholder="Position title" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Location</label>
              <Select value={formData.location} onValueChange={v => set('location', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="on-site">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Priority</label>
              <Select value={formData.priority} onValueChange={v => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Deadline</label>
              <DatePicker
                value={formData.deadline}
                onChange={v => set('deadline', v)}
                placeholder="Select date"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Salary</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={formData.salary} onChange={e => set('salary', e.target.value)} className="pl-9" placeholder="$8,000/month" />
              </div>
            </div>
          </div>

          {availableTags.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map(tag => (
                  <button
                    key={tag.name}
                    type="button"
                    onClick={() => toggleTag(tag.name)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all border"
                    style={{
                      backgroundColor: formData.tags.includes(tag.name) ? tag.color : `${tag.color}20`,
                      color: formData.tags.includes(tag.name) ? 'white' : tag.color,
                      borderColor: `${tag.color}40`,
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Job Posting URL</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={formData.job_url} onChange={e => set('job_url', e.target.value)} className="pl-9" placeholder="https://..." />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={formData.saved_notes}
              onChange={e => set('saved_notes', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
              placeholder="Why you're interested, notes to remember..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !canSubmit} className="gap-1.5">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Bookmark className="h-3.5 w-3.5" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SaveInternshipModal
