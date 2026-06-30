import {
  Briefcase, Target, Users, Award, XCircle, Bookmark,
  Clock, AlertTriangle, TrendingUp, Zap, MapPin, Calendar,
  Activity, MessageSquare,
} from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'
import CompanyLogo from './CompanyLogo'

const STATUS = {
  saved:        { label: 'Saved',        color: '#8b5cf6', Icon: Bookmark },
  applied:      { label: 'Applied',      color: '#3b82f6', Icon: Target },
  interviewing: { label: 'Interviewing', color: '#f59e0b', Icon: Users },
  offer:        { label: 'Offer',        color: '#10b981', Icon: Award },
  rejected:     { label: 'Rejected',     color: '#ef4444', Icon: XCircle },
}

const PIPELINE = ['applied', 'interviewing', 'offer']

const FUNNEL_LABELS = {
  applied: 'Applied',
  interviewing: 'Interview',
  offer: 'Offer',
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

function computeStats(internships) {
  const total = internships.length
  const counts = internships.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1
    return acc
  }, {})

  const active = (counts.applied || 0) + (counts.interviewing || 0) + (counts.offer || 0)
  const responded = (counts.interviewing || 0) + (counts.offer || 0) + (counts.rejected || 0)
  const decided = responded + (counts.applied || 0)
  const responseRate = decided > 0 ? Math.round((responded / decided) * 100) : 0
  const offerRate = active > 0 ? Math.round(((counts.offer || 0) / active) * 100) : 0

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recent = internships.filter(i => i.applied_date && new Date(i.applied_date) >= thirtyDaysAgo).length

  const sevenDaysOut = new Date()
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7)

  const withDeadline = internships.filter(i => i.deadline)
  const urgent = withDeadline.filter(i => {
    const d = daysUntil(i.deadline)
    return d !== null && d >= 0 && d <= 7
  })
  const overdue = withDeadline.filter(i => {
    const d = daysUntil(i.deadline)
    return d !== null && d < 0
  })

  const remote = internships.filter(i => i.location === 'remote').length
  const onsite = internships.filter(i => i.location === 'on-site').length
  const hybrid = internships.filter(i => i.location === 'hybrid').length

  const pipelineMax = Math.max(...PIPELINE.map(s => counts[s] || 0), 1)

  const deadlineAlerts = [...urgent, ...overdue]
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4)

  return {
    total, counts, active, responseRate, offerRate, recent,
    urgent: urgent.length, overdue: overdue.length,
    remote, onsite, hybrid, pipelineMax, deadlineAlerts,
  }
}

function StatCell({ label, value, sub, alert, icon: Icon }) {
  return (
    <div className="relative px-3 py-2.5 border-r border-border last:border-r-0 min-w-0">
      <div className="flex items-start justify-between gap-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate pr-1">{label}</p>
        {Icon && (
          <div className={cn(
            'h-6 w-6 rounded-md border border-border flex items-center justify-center shrink-0',
            alert ? 'bg-destructive/10' : 'bg-muted/60'
          )}>
            <Icon className={cn('h-3 w-3', alert ? 'text-destructive' : 'text-muted-foreground')} />
          </div>
        )}
      </div>
      <p className={cn('text-xl font-bold tabular-nums leading-tight mt-1', alert && 'text-destructive')}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground tabular-nums truncate mt-0.5">{sub}</p>}
    </div>
  )
}

function Analytics({ internships }) {
  if (internships.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-3 py-6">
            <div className="h-10 w-10 rounded-md border border-border bg-muted flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">No targets in scope</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Import from a job link or add your first application to unlock pipeline intel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const s = computeStats(internships)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <Zap className="h-4 w-4 text-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider">Pipeline Intel</span>
          <Badge variant="outline" className="text-[10px] tabular-nums h-5">
            {s.total} tracked
          </Badge>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-border divide-x divide-border">
          <StatCell label="Total" value={s.total} sub={`+${s.recent} last 30d`} icon={Briefcase} />
          <StatCell label="Active" value={s.active} sub="in pipeline" icon={Activity} />
          <StatCell label="Interviewing" value={s.counts.interviewing || 0} sub="live rounds" icon={Users} />
          <StatCell label="Offers" value={s.counts.offer || 0} sub={`${s.offerRate}% of active`} icon={Award} />
          <StatCell label="Response" value={`${s.responseRate}%`} sub="heard back" icon={MessageSquare} />
          <StatCell
            label="Deadlines"
            value={s.urgent + s.overdue}
            sub={s.overdue > 0 ? `${s.overdue} overdue` : `${s.urgent} this week`}
            alert={s.overdue > 0}
            icon={s.overdue > 0 ? AlertTriangle : Clock}
          />
        </div>

        {/* Main body: funnel + alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Pipeline funnel */}
          <div className="lg:col-span-3 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Conversion funnel</p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {s.remote} Remote · {s.hybrid} Hybrid · {s.onsite} On-site
                </span>
                {(s.counts.saved || 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Bookmark className="h-3 w-3" />
                    {s.counts.saved} saved
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {PIPELINE.map(status => {
                const count = s.counts[status] || 0
                const pct = s.total > 0 ? Math.round((count / s.total) * 100) : 0
                const width = s.pipelineMax > 0 ? Math.max((count / s.pipelineMax) * 100, count > 0 ? 8 : 0) : 0
                const cfg = STATUS[status]
                return (
                  <div key={status} className="flex items-center gap-2">
                    <span className="text-[10px] uppercase w-20 shrink-0 text-muted-foreground truncate">
                      {FUNNEL_LABELS[status] ?? cfg.label}
                    </span>
                    <div className="flex-1 h-5 bg-muted/60 rounded-sm overflow-hidden border border-border/50">
                      <div
                        className="h-full rounded-sm transition-all duration-500 flex items-center justify-end pr-1.5 min-w-[2px]"
                        style={{ width: `${width}%`, backgroundColor: cfg.color }}
                      >
                        {count > 0 && width > 15 && (
                          <span className="text-[9px] font-bold text-white tabular-nums">{count}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium tabular-nums w-8 text-right">{count}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right hidden sm:block">
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Deadline alerts */}
          <div className="lg:col-span-2 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Action required
              </p>
              {s.overdue > 0 && (
                <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
                  {s.overdue} overdue
                </Badge>
              )}
            </div>

            {s.deadlineAlerts.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span>No deadlines in the next 7 days — keep hunting.</span>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {s.deadlineAlerts.map(i => {
                  const d = daysUntil(i.deadline)
                  const isOverdue = d !== null && d < 0
                  return (
                    <li
                      key={i.id}
                      className={cn(
                        'flex items-center gap-2.5 px-2 py-1.5 rounded-sm border text-xs',
                        isOverdue
                          ? 'border-destructive/30 bg-destructive/5'
                          : 'border-border bg-muted/30'
                      )}
                    >
                      <CompanyLogo
                        domain={i.company_domain}
                        name={i.company_name}
                        size={28}
                        className="rounded-md shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{i.company_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{i.role}</p>
                      </div>
                      <span className={cn(
                        'shrink-0 text-[10px] font-medium tabular-nums flex items-center gap-1',
                        isOverdue ? 'text-destructive' : d <= 3 ? 'text-orange-500' : 'text-muted-foreground'
                      )}>
                        {isOverdue ? (
                          <><AlertTriangle className="h-3 w-3" />{Math.abs(d)}d late</>
                        ) : (
                          <><Calendar className="h-3 w-3" />{d}d left</>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}

            {(s.counts.saved || 0) > 0 && (
              <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border flex items-center gap-1.5">
                <Bookmark className="h-3 w-3" />
                {s.counts.saved} saved role{(s.counts.saved || 0) !== 1 ? 's' : ''} waiting to be applied
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Analytics
