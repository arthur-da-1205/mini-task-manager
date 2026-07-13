import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDateTime } from '@/lib/format-date-time'
import type { Task } from '../resources/task.types'
import { AuditLogList } from './audit-log-list'
import { TaskStatusBadge } from './task-status-badge'

type AuditLogDrawerProps = {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuditLogDrawer({ task, open, onOpenChange }: AuditLogDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto p-0">
        <SheetHeader className="border-b bg-muted/40 px-6 py-6 pr-16">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
            Audit trail
          </div>
          <SheetTitle className="text-2xl">
            {task ? task.title : 'Audit log'}
          </SheetTitle>
          <SheetDescription>
            Immutable chronological record of status changes for this task.
          </SheetDescription>

          {task ? (
            <div className="mt-4 grid gap-3 rounded-lg border bg-background p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Current status</span>
                <TaskStatusBadge status={task.status} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Created at</span>
                <span className="text-right font-medium">
                  {formatDateTime(task.createdAt)}
                </span>
              </div>
            </div>
          ) : null}
        </SheetHeader>

        <div className="px-6 pb-8">
          {task ? <AuditLogList taskId={task.id} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
