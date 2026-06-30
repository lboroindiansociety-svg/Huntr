import { useState, useEffect, useRef } from 'react'
import { MapPin, FileText, Tag, DollarSign, Download, Trash2, Upload, Loader2, Link2 } from 'lucide-react'
import CompanyAutocomplete from './CompanyAutocomplete'
import { supabase } from '../lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { DatePicker } from './ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'
import ApplicationRounds from './ApplicationRounds'

function EditInternshipModal({
  internship, onClose, onUpdate,
  onAddRound, onUpdateRound, onDeleteRound, onMoveRound, onAddTemplate, roundSaving,
}) {
  const [formData, setFormData] = useState({
    company_name: internship.company_name || '',
    company_domain: internship.company_domain || '',
    role:          internship.role          || '',
    location:      internship.location      || 'remote',
    location_place:internship.location_place|| '',
    status:        internship.status        || 'applied',
    applied_date:  internship.applied_date  || '',
    deadline:      internship.deadline      || '',
    salary:        internship.salary        || '',
    notes:         internship.notes         || '',
    job_url:       internship.job_url       || '',
    tags:          internship.tags          || [],
  })
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState(internship.files || [])
  const [fileUploading, setFileUploading] = useState(false)
  const [availableTags, setAvailableTags] = useState([])
  const fileInputRef = useRef(null)

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

  const handleFileUpload = async (e) => {
    const newFiles = Array.from(e.target.files)
    setFileUploading(true)
    const uploaded = []
    for (const file of newFiles) {
      if (file.size > 10 * 1024 * 1024) { alert(`${file.name} is too large`); continue }
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const { error } = await supabase.storage.from('internship-files').upload(fileName, file)
      if (error) { console.error(error); continue }
      const { data: signed } = await supabase.storage.from('internship-files').createSignedUrl(fileName, 3600)
      const { data: pub } = supabase.storage.from('internship-files').getPublicUrl(fileName)
      uploaded.push({ name: file.name, size: file.size, type: file.type, url: signed?.signedUrl || pub.publicUrl, path: fileName })
    }
    setFiles(prev => [...prev, ...uploaded])
    setFileUploading(false)
  }

  const removeFile = async (i) => {
    const f = files[i]
    if (f.path) await supabase.storage.from('internship-files').remove([f.path])
    setFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async () => {
    if (!formData.company_name.trim() || !formData.role.trim()) return
    setLoading(true)
    try {
      await onUpdate({ ...formData, files })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = formData.status === 'saved'
    ? [
        { value: 'saved',        label: 'Saved' },
        { value: 'applied',      label: 'Applied' },
        { value: 'interviewing', label: 'Interviewing' },
        { value: 'offer',        label: 'Offer' },
        { value: 'rejected',     label: 'Rejected' },
      ]
    : [
        { value: 'applied',      label: 'Applied' },
        { value: 'interviewing', label: 'Interviewing' },
        { value: 'offer',        label: 'Offer' },
        { value: 'rejected',     label: 'Rejected' },
      ]

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto px-1.5 py-0.5">
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
              <Input value={formData.role} onChange={e => set('role', e.target.value)} placeholder="Software Engineering Intern" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Location Type</label>
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
              <label className="text-sm font-medium">City / Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={formData.location_place} onChange={e => set('location_place', e.target.value)} className="pl-9" placeholder="San Francisco, CA" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Applied Date</label>
              <DatePicker
                value={formData.applied_date}
                onChange={v => set('applied_date', v)}
                placeholder="Select date"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Deadline</label>
              <DatePicker
                value={formData.deadline}
                onChange={v => set('deadline', v)}
                placeholder="Select date"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Salary / Stipend</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={formData.salary} onChange={e => set('salary', e.target.value)} className="pl-9" placeholder="$8,000/month" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Job Posting URL</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={formData.job_url} onChange={e => set('job_url', e.target.value)} className="pl-9" placeholder="https://..." />
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

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">Interview Rounds</label>
            <ApplicationRounds
              rounds={internship.application_rounds}
              internshipStatus={formData.status}
              compact={false}
              saving={roundSaving === internship.id}
              onAddRound={data => onAddRound?.(internship.id, data)}
              onUpdateRound={(roundId, updates) => onUpdateRound?.(internship.id, roundId, updates)}
              onDeleteRound={roundId => onDeleteRound?.(internship.id, roundId)}
              onMoveRound={(roundId, dir) => onMoveRound?.(internship.id, roundId, dir)}
              onAddTemplate={() => onAddTemplate?.(internship.id)}
            />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
              placeholder="Notes about this application..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Attachments</label>
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Click to upload files</span>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} className="hidden" disabled={fileUploading} />
            </label>
            {fileUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
              </div>
            )}
            {files.length > 0 && (
              <div className="space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{f.name}</p>
                        {f.size && <p className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                        <a href={f.url} target="_blank" rel="noopener noreferrer"><Download className="h-3.5 w-3.5" /></a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeFile(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.company_name.trim() || !formData.role.trim()} className="gap-1.5">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditInternshipModal
