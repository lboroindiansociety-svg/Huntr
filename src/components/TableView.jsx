import { useState } from 'react'

import { Edit, Trash2, Building, AlertTriangle } from 'lucide-react'

import EditInternshipModal from './EditInternshipModal'
import CompanyLogo from './CompanyLogo'
import { getCurrentRound, formatRoundDate } from '../lib/rounds'

import SortableTableRow from './SortableTableRow'

import { Badge } from './ui/badge'

import { Button } from './ui/button'

import { Card } from './ui/card'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'

import { cn } from '@/lib/utils'



const STATUS_VARIANT = {

  saved: 'saved', applied: 'applied', interviewing: 'interviewing',

  offer: 'offer', rejected: 'rejected',

}

const LOCATION_VARIANT = {

  remote: 'remote', 'on-site': 'on-site', hybrid: 'hybrid',

}



const TH = 'py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center'

const TD = 'py-3 px-4 text-center'



function fmt(d) {

  if (!d) return '—'

  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

}



function deadlineClass(deadline) {

  if (!deadline) return null

  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000)

  if (diff < 0)  return 'text-destructive'

  if (diff <= 3) return 'text-orange-500 dark:text-orange-400'

  if (diff <= 7) return 'text-amber-500 dark:text-amber-400'

  return 'text-muted-foreground'

}



function TableView({
  internships, onUpdate, onDelete, dragMode = false,
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

        <div className="flex flex-col items-center gap-4">

          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">

            <Building className="h-7 w-7 text-muted-foreground" />

          </div>

          <p className="font-semibold">No applications here</p>

        </div>

      </Card>

    )

  }



  return (

    <>

      <Card className="overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="border-b border-border bg-muted/30">

                {dragMode && <th className="w-8 py-3 px-2" />}

                <th className={TH}>Company</th>

                <th className={TH}>Role</th>

                <th className={TH}>Status</th>

                <th className={TH}>Current Round</th>

                <th className={TH}>Location</th>

                <th className={TH}>Applied</th>

                <th className={TH}>Deadline</th>

                <th className={TH}>Tags</th>

                <th className={TH}>Actions</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-border">

              {internships.map(internship => {

                const dlCls = deadlineClass(internship.deadline)

                return (

                  <SortableTableRow key={internship.id} id={internship.id} dragMode={dragMode}>

                    <td className={TD}>

                      <div className="flex items-center justify-center gap-2.5">

                        <CompanyLogo
                          domain={internship.company_domain}
                          name={internship.company_name}
                          size={28}
                          className="rounded-lg"
                        />

                        <span className="font-medium truncate max-w-[120px]">{internship.company_name}</span>

                      </div>

                    </td>

                    <td className={cn(TD, 'text-muted-foreground truncate max-w-[160px]')}>{internship.role}</td>

                    <td className={TD}>

                      <Badge variant={STATUS_VARIANT[internship.status] || 'outline'} className="capitalize text-[11px]">

                        {internship.status}

                      </Badge>

                    </td>

                    <td className={cn(TD, 'text-xs text-muted-foreground max-w-[120px]')}>
                      {(() => {
                        const current = getCurrentRound(internship.application_rounds)
                        if (!current) return '—'
                        return (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="truncate max-w-[110px] font-medium text-foreground">{current.name}</span>
                            {current.scheduled_at && (
                              <span className="text-[10px] tabular-nums">{formatRoundDate(current.scheduled_at)}</span>
                            )}
                          </div>
                        )
                      })()}
                    </td>

                    <td className={TD}>

                      <div className="flex flex-col items-center gap-0.5">

                        <Badge variant={LOCATION_VARIANT[internship.location] || 'outline'} className="capitalize text-[11px]">

                          {internship.location}

                        </Badge>

                        {internship.location_place && (

                          <span className="text-xs text-muted-foreground truncate max-w-[100px]">{internship.location_place}</span>

                        )}

                      </div>

                    </td>

                    <td className={cn(TD, 'text-muted-foreground text-xs tabular-nums')}>{fmt(internship.applied_date)}</td>

                    <td className={TD}>

                      {internship.deadline ? (

                        <span className={cn('text-xs tabular-nums', dlCls)}>{fmt(internship.deadline)}</span>

                      ) : (

                        <span className="text-muted-foreground text-xs">—</span>

                      )}

                    </td>

                    <td className={TD}>

                      {internship.tags && internship.tags.length > 0 ? (

                        <div className="flex flex-wrap gap-1 justify-center">

                          {internship.tags.slice(0, 2).map(t => (

                            <span

                              key={t}

                              className="px-1.5 py-0.5 rounded-full text-[10px] font-medium border"

                              style={{ backgroundColor: '#6b728015', color: '#6b7280', borderColor: '#6b728030' }}

                            >

                              {t}

                            </span>

                          ))}

                          {internship.tags.length > 2 && (

                            <span className="text-[10px] text-muted-foreground px-1">+{internship.tags.length - 2}</span>

                          )}

                        </div>

                      ) : (

                        <span className="text-muted-foreground text-xs">—</span>

                      )}

                    </td>

                    <td className={TD}>

                      <div className="flex items-center justify-center gap-0.5">

                        <Button

                          variant="ghost" size="icon"

                          className="h-7 w-7 text-muted-foreground hover:text-foreground"

                          onClick={() => setEditingInternship(internship)}

                        >

                          <Edit className="h-3.5 w-3.5" />

                        </Button>

                        <Button

                          variant="ghost" size="icon"

                          className="h-7 w-7 text-muted-foreground hover:text-destructive"

                          onClick={() => setDeleteConfirm(internship)}

                        >

                          <Trash2 className="h-3.5 w-3.5" />

                        </Button>

                      </div>

                    </td>

                  </SortableTableRow>

                )

              })}

            </tbody>

          </table>

        </div>

      </Card>



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



export default TableView

