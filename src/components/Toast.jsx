import { useEffect, useState } from 'react'
import { CheckCircle, X, AlertCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const CONFIG = {
  success: {
    Icon: CheckCircle,
    cls: 'text-emerald-500',
    bg:  'bg-card border-border',
  },
  error: {
    Icon: AlertCircle,
    cls: 'text-destructive',
    bg:  'bg-card border-border',
  },
  warning: {
    Icon: AlertTriangle,
    cls: 'text-amber-500',
    bg:  'bg-card border-border',
  },
}

function Toast({ message, isVisible, onClose, type = 'success' }) {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setMounted(true)
      requestAnimationFrame(() => setVisible(true))
      const t = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 300)
      }, 3500)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(t)
    }
  }, [isVisible])

  if (!mounted) return null

  const { Icon, cls, bg } = CONFIG[type] || CONFIG.success

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium max-w-xs transition-all duration-300',
          bg,
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        )}
      >
        <Icon className={cn('h-4 w-4 flex-shrink-0', cls)} />
        <span className="flex-1">{message}</span>
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default Toast
