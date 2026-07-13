import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  useDeleteTaskMutation,
  useTasksQuery,
  useUpdateTaskStatusMutation,
} from '@/features/tasks/services/task.queries'
import { ActorSelect } from '@/features/tasks/components/actor-select'
import { AuditLogDrawer } from '@/features/tasks/components/audit-log-drawer'
import { CreateTaskForm } from '@/features/tasks/components/create-task-form'
import { StatusUpdateConfirmationDialog } from '@/features/tasks/components/status-update-confirmation-dialog'
import { TaskCard } from '@/features/tasks/components/task-card'
import { getNextTaskStatus } from '@/features/tasks/libs/get-next-task-status'
import type { Actor, Task } from '@/features/tasks/resources/task.types'
import { getErrorMessage } from '@/lib/get-error-message'

export function TaskManagerPage() {
  const [actor, setActor] = useState<Actor>('john.doe')
  const [auditLogTask, setAuditLogTask] = useState<Task | null>(null)
  const [statusUpdateTask, setStatusUpdateTask] = useState<Task | null>(null)

  const tasksQuery = useTasksQuery()
  const updateStatusMutation = useUpdateTaskStatusMutation()
  const deleteTaskMutation = useDeleteTaskMutation((taskId) => {
    if (auditLogTask?.id === taskId) {
      setAuditLogTask(null)
    }

    if (statusUpdateTask?.id === taskId) {
      setStatusUpdateTask(null)
    }
  })

  const errorMessage =
    getErrorMessage(tasksQuery.error) ??
    getErrorMessage(updateStatusMutation.error) ??
    getErrorMessage(deleteTaskMutation.error)

  function handleConfirmStatusUpdate() {
    if (!statusUpdateTask) {
      return
    }

    const nextStatus = getNextTaskStatus(statusUpdateTask.status)

    if (!nextStatus) {
      return
    }

    updateStatusMutation.mutate(
      {
        taskId: statusUpdateTask.id,
        status: nextStatus,
        actor,
      },
      {
        onSuccess: () => setStatusUpdateTask(null),
      },
    )
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10">
      <header className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Qonflo assessment
          </p>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Mini Task Manager
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Task status can only move forward: to_do → pending → in_progress →
              done.
            </p>
          </div>
        </div>

        <ActorSelect value={actor} onChange={setActor} />
      </header>

      <CreateTaskForm />

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Active tasks</CardTitle>
            <CardDescription>
              {tasksQuery.data?.length ?? 0} active task(s)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {tasksQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading tasks...</p>
          ) : null}

          {!tasksQuery.isLoading && tasksQuery.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active tasks yet.</p>
          ) : null}

          <div className="grid gap-4">
            {tasksQuery.data?.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                actor={actor}
                isUpdating={updateStatusMutation.isPending}
                isDeleting={deleteTaskMutation.isPending}
                onAdvanceStatus={setStatusUpdateTask}
                onDelete={deleteTaskMutation.mutate}
                onOpenAuditLog={setAuditLogTask}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <AuditLogDrawer
        task={auditLogTask}
        open={auditLogTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAuditLogTask(null)
          }
        }}
      />

      <StatusUpdateConfirmationDialog
        task={statusUpdateTask}
        actor={actor}
        open={statusUpdateTask !== null}
        isSubmitting={updateStatusMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setStatusUpdateTask(null)
          }
        }}
        onConfirm={handleConfirmStatusUpdate}
      />
    </main>
  )
}
