import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { STATUS_LABELS } from '../resources/task.constants'
import { getNextTaskStatus } from '../libs/get-next-task-status'
import type { Actor, Task } from '../resources/task.types'

type StatusUpdateConfirmationDialogProps = {
  task: Task | null
  actor: Actor
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function StatusUpdateConfirmationDialog({
  task,
  actor,
  open,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: StatusUpdateConfirmationDialogProps) {
  const nextStatus = task ? getNextTaskStatus(task.status) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm status update</DialogTitle>
          <DialogDescription>
            This action will update the task status and create an immutable audit
            log entry.
          </DialogDescription>
        </DialogHeader>

        {task && nextStatus ? (
          <div className="rounded-md border bg-muted/40 p-4 text-sm">
            <p className="font-medium text-foreground">{task.title}</p>
            <p className="mt-2 text-muted-foreground">
              Actor <span className="font-medium text-foreground">{actor}</span> will
              move status from{' '}
              <code className="rounded bg-secondary px-1.5 py-0.5">
                {task.status}
              </code>{' '}
              to{' '}
              <code className="rounded bg-secondary px-1.5 py-0.5">
                {nextStatus}
              </code>
              .
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This task has no next valid status.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={!task || !nextStatus || isSubmitting}
          >
            {isSubmitting
              ? 'Updating...'
              : nextStatus
                ? `Confirm move to ${STATUS_LABELS[nextStatus]}`
                : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
