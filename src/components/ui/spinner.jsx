import { cn } from '@/lib/utils'

function Spinner({ className, ...props }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      {...props}
    />
  )
}

export { Spinner }
