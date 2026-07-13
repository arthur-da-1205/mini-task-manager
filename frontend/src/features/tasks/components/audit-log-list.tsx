import { useTaskAuditLogsQuery } from '../services/task.queries'
import { formatDateTime } from '../../../lib/format-date-time'
import { TaskStatusBadge } from './task-status-badge'

type AuditLogListProps = {
  taskId: string
}

export function AuditLogList({ taskId }: AuditLogListProps) {
  const auditLogsQuery = useTaskAuditLogsQuery(taskId)

  return (
    <div className="mt-6">
      {auditLogsQuery.isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl border bg-muted/50"
            />
          ))}
        </div>
      ) : null}

      {!auditLogsQuery.isLoading && auditLogsQuery.data?.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center">
          <p className="font-medium text-foreground">No status changes yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit entries will appear here after a valid status transition.
          </p>
        </div>
      ) : null}

      <ol className="relative space-y-4 pl-8">
        {auditLogsQuery.data?.map((log, index) => (
          <li key={log.id} className="relative">
            <div className="absolute -left-8 top-2 flex h-6 w-6 items-center justify-center rounded-full border-4 border-background bg-primary text-[11px] font-bold text-primary-foreground shadow-sm">
              {index + 1}
            </div>
            {index < auditLogsQuery.data.length - 1 ? (
              <div className="absolute -left-5 top-8 h-[calc(100%+1rem)] w-px bg-border" />
            ) : null}

            <article className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{log.actor}</p>
                  <p className="text-sm text-muted-foreground">
                    Updated status for{' '}
                    <span className="font-medium text-foreground">{log.taskTitle}</span>
                  </p>
                </div>
                <time className="text-xs font-medium text-muted-foreground">
                  {formatDateTime(log.createdAt)}
                </time>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <TaskStatusBadge status={log.fromStatus} className="text-xs" />
                <span className="text-muted-foreground">→</span>
                <TaskStatusBadge status={log.toStatus} className="text-xs" />
              </div>
            </article>
          </li>
        ))}
      </ol>
    </div>
  )
}
