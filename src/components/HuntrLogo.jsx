import { Crosshair } from 'lucide-react'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: { icon: 'h-4 w-4', text: 'text-sm', gap: 'gap-1.5' },
  md: { icon: 'h-5 w-5', text: 'text-lg', gap: 'gap-2' },
  lg: { icon: 'h-7 w-7', text: 'text-2xl', gap: 'gap-2.5' },
  xl: { icon: 'h-10 w-10', text: 'text-4xl', gap: 'gap-3' },
}

function HuntrLogo({ size = 'md', className, showIcon = true, showCursor = true, variant = 'default' }) {
  const s = SIZES[size] || SIZES.md
  const onDark = variant === 'light'

  return (
    <div
      className={cn('inline-flex items-center font-bold tracking-tight select-none', s.gap, className)}
      aria-label="Huntr"
    >
      {showIcon && (
        <Crosshair
          className={cn(s.icon, onDark ? 'text-emerald-400' : 'text-primary', 'shrink-0')}
          strokeWidth={2.25}
        />
      )}
      <span className={cn(s.text, onDark ? 'text-white' : 'text-foreground', 'uppercase')}>
        huntr
        {showCursor && (
          <span className={cn('animate-pulse', onDark ? 'text-emerald-400' : 'text-primary')}>_</span>
        )}
      </span>
    </div>
  )
}

export default HuntrLogo
