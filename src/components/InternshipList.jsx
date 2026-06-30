import { useState } from 'react'
import { Edit, Trash2, Calendar, MapPin, Building, Tag, Clock, FileText, Download, DollarSign, CheckCheck, AlertTriangle, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import EditInternshipModal from './EditInternshipModal'
import CompanyLogo from './CompanyLogo'
import SortableInternshipCard from './SortableInternshipCard'
import ApplicationRounds from './ApplicationRounds'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Separator } from './ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { cn } from '@/lib/utils'

const STATUS_VARIANT = {
  saved: 'saved', applied: 'applied', interviewing: 'interviewing',
  offer: 'offer', rejected: 'rejected',
}

const LOCATION_VARIANT = {
  remote: 'remote', 'on-site': 'on-site', hybrid: 'hybrid',
}

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function deadlineInfo(deadline) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000)
  if (diff < 0)  return { text: 'Overdue',         cls: 'text-destructive' }
  if (diff <= 3) return { text: `${diff}d left`,   cls: 'text-orange-500 dark:text-orange-400' }
  if (diff <= 7) return { text: `${diff}d left`,   cls: 'text-amber-500 dark:text-amber-400' }
  return         { text: `${diff}d left`,           cls: 'text-muted-foreground' }
}

function hasMetaDetails(internship) {
  return !!(
    internship.location_place ||
    internship.applied_date ||
    internship.salary ||
    internship.deadline
  )
}

function InternshipList({
  internships, onUpdate, onDelete, onMarkAsApplied, dragMode = false,
  onAddRound, onUpdateRound, onDeleteRound, onMoveRound, onAddTemplate, roundSaving,
}) {
  const [editingInternship, setEditingInternship] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleUpdate = async (updates) => {
    await onUpdate(editingInternship.id, updates)
    setEditingInternship(null)
  }

  const handleDelete = async (id) => {
    await onDelete(id)
    setDeleteConfirm(null)
  }

  if (internships.length === 0) {
    return (
      <Card className="py-16 text-center">
        <CardContent className="pt-0 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Building className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No applications here yet</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or add a new application.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {internships.map(internship => {
          const dl = deadlineInfo(internship.deadline)
          return (
            <SortableInternshipCard key={internship.id} id={internship.id} dragMode={dragMode}>
              <Card className="group hover:border-border/80 transition-all duration-200 h-full flex flex-col">
                <CardContent className="px-5 pt-5 pb-2 sm:px-6 sm:pt-6 sm:pb-3 flex flex-col flex-1 h-full min-w-0">
                  {/* Header */}
                  <div className="flex items-start gap-3 shrink-0">
                    <CompanyLogo
                      domain={internship.company_domain}
                      name={internship.company_name}
                      size={48}
                    />
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base truncate">{internship.company_name}</h3>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">{internship.role}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        <Badge variant={STATUS_VARIANT[internship.status] || 'outline'} className="capitalize text-[11px]">
                          {internship.status}
                        </Badge>
                        {internship.location && (
                          <Badge variant={LOCATION_VARIANT[internship.location] || 'outline'} className="capitalize text-[11px]">
                            {internship.location}
                          </Badge>
                        )}
                        {internship.status === 'saved' && internship.priority && (
                          <Badge variant="outline" className="text-[11px] capitalize">{internship.priority} priority</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body — grows to fill card height */}
                  <div className="flex flex-col flex-1 gap-4 mt-4 min-h-0">
                  {hasMetaDetails(internship) && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      {internship.location_place && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{internship.location_place}</span>
                        </span>
                      )}
                      {internship.applied_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {formatDate(internship.applied_date)}
                        </span>
                      )}
                      {internship.salary && (
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{internship.salary}</span>
                        </span>
                      )}
                      {dl && (
                        <span className={cn('flex items-center gap-1.5 font-medium', dl.cls)}>
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {dl.text}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {internship.tags && internship.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {internship.tags.map(t => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
                          style={{ backgroundColor: '#6b728015', color: '#6b7280', borderColor: '#6b728030' }}
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <ApplicationRounds
                    rounds={internship.application_rounds}
                    internshipStatus={internship.status}
                    compact
                    saving={roundSaving === internship.id}
                    onAddRound={data => onAddRound?.(internship.id, data)}
                    onUpdateRound={(roundId, updates) => onUpdateRound?.(internship.id, roundId, updates)}
                    onDeleteRound={roundId => onDeleteRound?.(internship.id, roundId)}
                    onMoveRound={(roundId, dir) => onMoveRound?.(internship.id, roundId, dir)}
                    onAddTemplate={() => onAddTemplate?.(internship.id)}
                  />

                  {/* Notes */}
                  {(internship.notes || (internship.status === 'saved' && internship.saved_notes)) && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {internship.notes || internship.saved_notes}
                      </p>
                    </div>
                  )}

                  {/* Files */}
                  {internship.files && internship.files.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {internship.files.map((file, i) => (
                        <a
                          key={i}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/50 text-xs hover:bg-muted transition-colors"
                          onClick={async (e) => {
                            if (file.url.includes('/storage/v1/object/sign/') && file.path) {
                              try {
                                const { data, error } = await supabase.storage
                                  .from('internship-files').createSignedUrl(file.path, 3600)
                                if (!error && data?.signedUrl) { window.open(data.signedUrl, '_blank'); e.preventDefault() }
                              } catch {}
                            }
                          }}
                        >
                          <FileText className="h-3 w-3" />
                          {file.name}
                          <Download className="h-3 w-3 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  )}
                  </div>

                  {/* Footer — pinned to bottom */}
                  <div className="mt-auto pt-3 flex flex-col gap-1.5 shrink-0">
                  <Separator />

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2">
                    {internship.job_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-foreground gap-1.5 min-w-0 max-w-[50%]"
                        asChild
                      >
                        <a
                          href={internship.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">View posting</span>
                        </a>
                      </Button>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                    {internship.status === 'saved' && onMarkAsApplied && (
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 text-muted-foreground hover:text-emerald-600 gap-1.5"
                        onClick={() => onMarkAsApplied(internship.id)}
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Apply
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 text-muted-foreground hover:text-foreground gap-1.5"
                      onClick={() => setEditingInternship(internship)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 text-muted-foreground hover:text-destructive gap-1.5"
                      onClick={() => setDeleteConfirm(internship)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                    </div>
                  </div>
                  </div>
                </CardContent>
              </Card>
            </SortableInternshipCard>
          )
        })}
      </div>

      {editingInternship && (
        <EditInternshipModal
          internship={editingInternship}
          onClose={() => setEditingInternship(null)}
          onUpdate={handleUpdate}
          onAddRound={onAddRound}
          onUpdateRound={onUpdateRound}
          onDeleteRound={onDeleteRound}
          onMoveRound={onMoveRound}
          onAddTemplate={onAddTemplate}
          roundSaving={roundSaving}
        />
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={open => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Application
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Delete <span className="font-semibold text-foreground">{deleteConfirm?.company_name}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm.id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default InternshipList
