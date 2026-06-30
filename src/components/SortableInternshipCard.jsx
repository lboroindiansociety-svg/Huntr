import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

function SortableInternshipCard({ children, id, dragMode = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative h-full ${isDragging ? 'opacity-50 z-10' : ''}`}
    >
      {dragMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-3 top-3 cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      <div className={cn('h-full', dragMode && 'pl-6')}>
        {children}
      </div>
    </div>
  )
}

export default SortableInternshipCard 