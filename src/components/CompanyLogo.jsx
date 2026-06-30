import { useState } from 'react'
import { cn } from '../lib/utils'
import { getLogoUrl } from '../lib/logoDev'

function CompanyLogo({
  domain,
  name,
  size = 48,
  className,
  imgClassName,
}) {
  const [error, setError] = useState(false)
  const url = getLogoUrl({ domain, name, size })
  const initial = (name || domain || '?').charAt(0).toUpperCase()

  if (!url || error) {
    return (
      <div
        className={cn(
          'rounded-xl bg-muted flex items-center justify-center flex-shrink-0 font-semibold text-muted-foreground border border-border',
          className
        )}
        style={{ width: size, height: size, fontSize: Math.max(12, size * 0.35) }}
      >
        {initial}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl bg-muted flex items-center justify-center flex-shrink-0 border border-border overflow-hidden',
        className
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setError(true)}
        className={cn('h-full w-full object-contain p-1', imgClassName)}
      />
    </div>
  )
}

export default CompanyLogo
