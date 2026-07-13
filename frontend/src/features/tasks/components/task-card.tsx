import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { STATUS_LABELS } from '../resources/task.constants'
import { formatDateTime } from '../../../lib/format-date-time'
import { getNextTaskStatus } from '../libs/get-next-task-status'
import type { Actor, Task } from '../resources/task.types'
import { TaskStatusBadge } from './task-status-badge'

type TaskCardProps = {
  task: Task
  actor: Actor
  isUpdating: boolean
  isDeleting: boolean
  onAdvanceStatus: (task: Task) => void
  onDelete: (taskId: string) => void
  onOpenAuditLog: (task: Task) => void
}

export function TaskCard({
  task,
  actor,
  isUpdating,
  isDeleting,
  onAdvanceStatus,
  onDelete,
  onOpenAuditLog,
}: TaskCardProps) {
  const nextStatus = getNextTaskStatus(task.status)

  return (
    <Card className="bg-muted/30">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle>{task.title}</CardTitle>
          {task.description ? (
            <CardDescription>{task.description}</CardDescription>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Created {formatDateTime(task.createdAt)}
          </p>
        </div>
        <TaskStatusBadge status={task.status} />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => onAdvanceStatus(task)}
            disabled={!nextStatus || isUpdating}
          >
            {nextStatus ? `Move to ${STATUS_LABELS[nextStatus]}` : 'Done'}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onOpenAuditLog(task)}
          >
            View audit log
          </Button>

          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => onDelete(task.id)}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Current actor for status changes: {actor}
        </p>

      </CardContent>
    </Card>
  )
}
