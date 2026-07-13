import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STATUS_LABELS } from '../resources/task.constants'
import type { TaskStatus } from '../resources/task.types'

const statusClassName: Record<TaskStatus, string> = {
  to_do: 'border-slate-200 bg-slate-100 text-slate-700',
  pending: 'border-amber-200 bg-amber-100 text-amber-800',
  in_progress: 'border-blue-200 bg-blue-100 text-blue-800',
  done: 'border-emerald-200 bg-emerald-100 text-emerald-800',
}

type TaskStatusBadgeProps = {
  status: TaskStatus
  className?: string
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('whitespace-nowrap', statusClassName[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  )
}
