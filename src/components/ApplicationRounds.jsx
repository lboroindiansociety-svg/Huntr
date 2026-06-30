import { useState, useEffect } from 'react'
import {
  Check, Circle, X, Minus, ChevronDown, ChevronUp, Plus, Trash2,
  GripVertical, Calendar, Loader2,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { DatePicker } from './ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { cn } from '@/lib/utils'
import {
  ROUND_TYPES, ROUND_STATUSES, ROUND_TEMPLATES, sortRounds,
  getCurrentRound, getNextScheduledRound, formatRoundDate,
  toScheduledTimestamp, splitScheduledTimestamp,
} from '../lib/rounds'

const STATUS_ICON = {
  pending: { Icon: Circle, cls: 'text-muted-foreground' },
  scheduled: { Icon: Circle, cls: 'text-blue-500 fill-blue-500/20' },
  completed: { Icon: Check, cls: 'text-emerald-500' },
  passed: { Icon: Check, cls: 'text-emerald-500' },
  failed: { Icon: X, cls: 'text-destructive' },
  skipped: { Icon: Minus, cls: 'text-muted-foreground' },
}

function RoundStepIcon({ status, isCurrent }) {
  const { Icon, cls } = STATUS_ICON[status] || STATUS_ICON.pending
  return (
    <div className={cn(
      'flex items-center justify-center w-5 h-5 rounded-full shrink-0',
      isCurrent && status === 'scheduled' && 'ring-2 ring-blue-500/40 ring-offset-1 ring-offset-background',
    )}>
      <Icon className={cn('h-3.5 w-3.5', cls, status === 'scheduled' && 'fill-current')} />
    </div>
  )
}

function RoundEditorRow({ round, onUpdate, onDelete, onMove, isFirst, isLast, saving }) {
  const [local, setLocal] = useState(round)
  const { date, time } = splitScheduledTimestamp(local.scheduled_at)

  useEffect(() => { setLocal(round) }, [round.id, round.name, round.notes, round.status, round.round_type, round.scheduled_at])

  const commit = (updates) => onUpdate(round.id, updates)

  const handleStatusChange = (status) => {
    const updates = { status }
    if (['completed', 'passed', 'failed', 'skipped'].includes(status) && !local.completed_at) {
      updates.completed_at = new Date().toISOString()
    }
    setLocal(prev => ({ ...prev, ...updates }))
    commit(updates)
  }

  return (
    <div className="flex gap-2 p-2.5 rounded-lg border border-border bg-muted/30">
      <div className="flex flex-col gap-0.5 pt-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isFirst || saving} onClick={() => onMove(round.id, -1)}>
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isLast || saving} onClick={() => onMove(round.id, 1)}>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={local.name}
            onChange={e => setLocal(prev => ({ ...prev, name: e.target.value }))}
            onBlur={() => { if (local.name !== round.name) commit({ name: local.name }) }}
            placeholder="Round name"
            className="h-8 text-sm"
            disabled={saving}
          />
          <Select value={local.round_type} onValueChange={v => { setLocal(prev => ({ ...prev, round_type: v })); commit({ round_type: v }) }} disabled={saving}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROUND_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Select value={local.status} onValueChange={handleStatusChange} disabled={saving}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROUND_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <DatePicker
            value={date}
            onChange={v => {
              const scheduled_at = toScheduledTimestamp(v, time)
              setLocal(prev => ({ ...prev, scheduled_at }))
              commit({ scheduled_at })
            }}
            placeholder="Schedule"
            className="h-8 text-xs"
            disabled={saving}
          />
          <Input
            type="time"
            value={time}
            onChange={e => {
              const scheduled_at = toScheduledTimestamp(date, e.target.value)
              setLocal(prev => ({ ...prev, scheduled_at }))
              commit({ scheduled_at })
            }}
            className="h-8 text-xs"
            disabled={saving}
          />
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive justify-self-end"
            onClick={() => onDelete(round.id)}
            disabled={saving}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Input
          value={local.notes || ''}
          onChange={e => setLocal(prev => ({ ...prev, notes: e.target.value }))}
          onBlur={() => { if ((local.notes || '') !== (round.notes || '')) commit({ notes: local.notes || null }) }}
          placeholder="Notes for this round..."
          className="h-8 text-xs"
          disabled={saving}
        />
      </div>
    </div>
  )
}

function ApplicationRounds({
  rounds = [],
  internshipStatus,
  compact = false,
  onAddRound,
  onUpdateRound,
  onDeleteRound,
  onMoveRound,
  onAddTemplate,
  saving = false,
}) {
  const [expanded, setExpanded] = useState(!compact)
  const sorted = sortRounds(rounds)
  const current = getCurrentRound(sorted)
  const nextUp = getNextScheduledRound(sorted)
  const showSection = sorted.length > 0 || ['applied', 'interviewing', 'offer'].includes(internshipStatus)

  if (!showSection) return null

  const handleAdd = (template) => {
    onAddRound(template || { name: 'New Round', round_type: 'other', status: 'pending' })
    if (compact) setExpanded(true)
  }

  return (
    <div className="space-y-2">
      {/* Compact stepper */}
      {sorted.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {sorted.map((round, i) => {
            const isCurrent = current?.id === round.id
            const isDone = ['completed', 'passed', 'skipped'].includes(round.status)
            return (
              <div key={round.id} className="flex items-center gap-1 shrink-0">
                <div className={cn('flex items-center gap-1.5 px-1.5 py-0.5 rounded-md', isCurrent && 'bg-muted')}>
                  <RoundStepIcon status={round.status} isCurrent={isCurrent} />
                  <span className={cn(
                    'text-[11px] font-medium truncate max-w-[72px]',
                    round.status === 'failed' && 'text-destructive',
                    isDone && 'text-muted-foreground',
                  )}>
                    {round.name}
                  </span>
                </div>
                {i < sorted.length - 1 && (
                  <div className={cn('w-3 h-px shrink-0', isDone ? 'bg-emerald-500/50' : 'bg-border')} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {nextUp && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3 shrink-0" />
          Next: <span className="font-medium text-foreground">{nextUp.name}</span>
          {nextUp.scheduled_at && <> — {formatRoundDate(nextUp.scheduled_at)}</>}
        </p>
      )}

      {/* Toggle + quick actions */}
      <div className="flex items-center gap-1 flex-wrap">
        <Button
          variant="ghost" size="sm"
          className="h-7 text-xs text-muted-foreground gap-1 px-2"
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {sorted.length === 0 ? 'Add rounds' : expanded ? 'Hide' : 'Manage rounds'}
        </Button>
        {!expanded && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2" onClick={() => handleAdd()} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Add
          </Button>
        )}
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="space-y-2">
          {sorted.length === 0 && (
            <p className="text-xs text-muted-foreground py-1">
              Track each stage — OA, phone screen, technical, final, etc.
            </p>
          )}

          {sorted.map((round, i) => (
            <RoundEditorRow
              key={round.id}
              round={round}
              onUpdate={onUpdateRound}
              onDelete={onDeleteRound}
              onMove={onMoveRound}
              isFirst={i === 0}
              isLast={i === sorted.length - 1}
              saving={saving}
            />
          ))}

          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleAdd()} disabled={saving}>
              <Plus className="h-3 w-3" /> Add round
            </Button>
            {sorted.length === 0 && onAddTemplate && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onAddTemplate} disabled={saving}>
                Add standard pipeline
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicationRounds
