import { Bookmark, ExternalLink } from 'lucide-react'
import CompanyLogo from './CompanyLogo'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Separator } from './ui/separator'
import { cn } from '@/lib/utils'

function DiscoverEntryCard({
  companyName,
  companyDomain,
  role,
  badges = [],
  body,
  jobUrl,
  saved,
  saveLabel = 'Save to Huntr_',
  onSave,
}) {
  return (
    <Card className="group hover:border-border/80 transition-all duration-200 h-full flex flex-col">
      <CardContent className="px-5 pt-5 pb-2 sm:px-6 sm:pt-6 sm:pb-3 flex flex-col flex-1 h-full min-w-0">
        <div className="flex items-start gap-3 shrink-0">
          <CompanyLogo domain={companyDomain} name={companyName} size={48} />
          <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">{companyName}</h3>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{role}</p>
            </div>
            {badges.length > 0 && (
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {badges}
              </div>
            )}
          </div>
        </div>

        {body && (
          <div className="flex flex-col flex-1 gap-4 mt-4 min-h-0">
            {body}
          </div>
        )}

        <div className="mt-auto pt-5 flex flex-col gap-1.5 shrink-0">
          <Separator />
          <div className="flex items-center justify-between gap-2 pt-1.5">
            {jobUrl ? (
              <Button size="sm" variant="outline" className="gap-1.5" asChild>
                <a href={jobUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </a>
              </Button>
            ) : (
              <span />
            )}
            <Button
              size="sm"
              className={cn('gap-1.5 shrink-0', saved && 'opacity-60')}
              disabled={saved}
              onClick={onSave}
            >
              <Bookmark className="h-3.5 w-3.5" />
              {saved ? 'Saved' : saveLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DiscoverEntryCard
