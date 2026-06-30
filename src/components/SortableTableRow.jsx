import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

function SortableTableRow({ children, id, dragMode = false }) {
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
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        isDragging ? 'opacity-50 z-10 bg-gray-100 dark:bg-gray-700' : ''
      }`}
    >
      {dragMode && (
        <td className="py-4 px-2 w-8">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </td>
      )}
      {children}
    </tr>
  )
}

export default SortableTableRow 