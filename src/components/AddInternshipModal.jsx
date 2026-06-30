import { useState, useEffect, useRef } from 'react'
import { MapPin, FileText, Tag, Upload, DollarSign, Download, Trash2, Loader2, Bookmark, Link2 } from 'lucide-react'
import CompanyAutocomplete from './CompanyAutocomplete'
import JobUrlAutoFill from './JobUrlAutoFill'
import { supabase } from '../lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { DatePicker } from './ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'

const FIELD = (label, children, hint) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium">{label}</label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
)

function AddInternshipModal({ onClose, onAdd, initialData }) {
  const [formData, setFormData] = useState({
    company_name: '',
    company_domain: '',
    role: '',
    location: 'remote',
    location_place: '',
    status: 'applied',
    applied_date: '',
    deadline: '',
    salary: '',
    notes: '',
    job_url: '',
    tags: [],
  })
  const [loading, setLoading] = useState(false)
  const [availableTags, setAvailableTags] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [fileUploading, setFileUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchCustomTags()
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        tags: initialData.tags || prev.tags,
      }))
      return
    }
    const draft = localStorage.getItem('internship_draft')
    if (draft) {
      try { setFormData(JSON.parse(draft)) } catch {}
    }
  }, [initialData])

  useEffect(() => {
    localStorage.setItem('internship_draft', JSON.stringify(formData))
  }, [formData])

  const fetchCustomTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('name')
    const unique = [...new Map((data || []).map(t => [t.name, t])).values()]
    setAvailableTags(unique)
  }

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const toggleTag = (name) => {
    set('tags', formData.tags.includes(name)
      ? formData.tags.filter(t => t !== name)
      : [...formData.tags, name]
    )
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    setFileUploading(true)
    const uploaded = []
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { alert(`${file.name} is too large (max 10MB)`); continue }
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const { error } = await supabase.storage.from('internship-files').upload(fileName, file)
      if (error) { console.error(error); continue }
      const { data: signedData } = await supabase.storage.from('internship-files').createSignedUrl(fileName, 3600)
      const { data: urlData } = supabase.storage.from('internship-files').getPublicUrl(fileName)
      uploaded.push({
        name: file.name, size: file.size, type: file.type,
        url: signedData?.signedUrl || urlData.publicUrl,
        path: fileName, signedUrl: signedData?.signedUrl,
      })
    }
    setUploadedFiles(prev => [...prev, ...uploaded])
    setFileUploading(false)
  }

  const removeFile = async (i) => {
    const f = uploadedFiles[i]
    await supabase.storage.from('internship-files').remove([f.path])
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (asSaved = false) => {
    setLoading(true)
    try {
      const data = {
        ...formData,
        files: uploadedFiles,
        ...(asSaved ? { status: 'saved', saved_date: new Date().toISOString(), saved_notes: formData.notes, priority: 'medium' } : {}),
      }
      await onAdd(data)
      localStorage.removeItem('internship_draft')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = formData.company_name.trim() && formData.role.trim()

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto px-1.5 py-0.5">
          <JobUrlAutoFill
            onParsed={parsed => setFormData(prev => ({
              ...prev,
              ...parsed,
              notes: parsed.notes || prev.notes,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            {FIELD('Company Name *',
              <CompanyAutocomplete
                value={formData.company_name}
                domain={formData.company_domain}
                onChange={({ name, domain }) => setFormData(prev => ({
                  ...prev,
                  company_name: name,
                  company_domain: domain || '',
                }))}
                required
              />
            )}
            {FIELD('Role/Position *',
              <Input
                value={formData.role}
                onChange={e => set('role', e.target.value)}
                placeholder="Software Engineering Intern"
                required
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FIELD('Location Type',
              <Select value={formData.location} onValueChange={v => set('location', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="on-site">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            )}
            {FIELD('City / Location',
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={formData.location_place}
                  onChange={e => set('location_place', e.target.value)}
                  className="pl-9"
                  placeholder="San Francisco, CA"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {FIELD('Status',
              <Select value={formData.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            )}
            {FIELD('Applied Date',
              <DatePicker
                value={formData.applied_date}
                onChange={v => set('applied_date', v)}
                placeholder="Select date"
              />
            )}
            {FIELD('Deadline',
              <DatePicker
                value={formData.deadline}
                onChange={v => set('deadline', v)}
                placeholder="Select date"
              />
            )}          </div>

          <div className="grid grid-cols-2 gap-3">
            {FIELD('Salary / Stipend',
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={formData.salary} onChange={e => set('salary', e.target.value)} className="pl-9" placeholder="$8,000/month" />
              </div>
            )}
            {FIELD('Job Posting URL',
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={formData.job_url} onChange={e => set('job_url', e.target.value)} className="pl-9" placeholder="https://..." />
              </div>
            )}
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

          {FIELD('Notes',
            <textarea
              value={formData.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
              placeholder="Notes about this application..."
            />
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Attachments</label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Click to upload · PDF, DOC, DOCX (max 10MB)</span>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} className="hidden" disabled={fileUploading} />
            </label>
            {fileUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
              </div>
            )}
            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
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

        <DialogFooter className="gap-2 sm:gap-2 flex-row">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">Cancel</Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={loading || !canSubmit}
            className="flex-1 sm:flex-none gap-1.5"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Save for Later
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={loading || !canSubmit}
            className="flex-1 sm:flex-none gap-1.5"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Add Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddInternshipModal
