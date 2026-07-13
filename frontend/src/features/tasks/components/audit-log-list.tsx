import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTaskAuditLogsQuery } from '../services/task.queries'
import { formatDateTime } from '../../../lib/format-date-time'

type AuditLogListProps = {
  taskId: string
}

export function AuditLogList({ taskId }: AuditLogListProps) {
  const auditLogsQuery = useTaskAuditLogsQuery(taskId)

  return (
    <Card className="mt-4 border-dashed bg-muted/30">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">Audit log</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {auditLogsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading audit logs...</p>
        ) : null}

        {!auditLogsQuery.isLoading && auditLogsQuery.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No status changes yet.</p>
        ) : null}

        <ol className="grid gap-2 pl-5 text-sm">
          {auditLogsQuery.data?.map((log) => (
            <li key={log.id} className="list-decimal text-muted-foreground">
              <span className="font-medium text-foreground">{log.actor}</span> changed{' '}
              <span className="font-medium text-foreground">{log.taskTitle}</span> from{' '}
              <code className="rounded bg-secondary px-1.5 py-0.5">{log.fromStatus}</code>{' '}
              to <code className="rounded bg-secondary px-1.5 py-0.5">{log.toStatus}</code>{' '}
              at {formatDateTime(log.createdAt)}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
