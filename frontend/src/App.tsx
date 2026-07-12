import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const STATUSES = ['to_do', 'pending', 'in_progress', 'done'] as const
const ACTORS = ['john.doe', 'jane.doe', 'qonflo.bot'] as const

type TaskStatus = (typeof STATUSES)[number]
type Actor = (typeof ACTORS)[number]

type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

type AuditLog = {
  id: string
  taskId: string
  taskTitle: string
  actor: string
  fromStatus: TaskStatus
  toStatus: TaskStatus
  createdAt: string
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  to_do: 'To do',
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
}

function getNextStatus(status: TaskStatus) {
  const currentIndex = STATUSES.indexOf(status)
  return STATUSES[currentIndex + 1] ?? null
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error?.message ?? 'Request failed')
  }

  return body.data
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : null
}

function App() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [actor, setActor] = useState<Actor>('john.doe')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => requestJson<Task[]>('/api/tasks'),
  })

  const auditLogsQuery = useQuery({
    queryKey: ['auditLogs', expandedTaskId],
    queryFn: () =>
      requestJson<AuditLog[]>(`/api/tasks/${expandedTaskId}/audit-logs`),
    enabled: expandedTaskId !== null,
  })

  const createTaskMutation = useMutation({
    mutationFn: (input: { title: string; description?: string }) =>
      requestJson<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      setTitle('')
      setDescription('')
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: (input: { taskId: string; status: TaskStatus; actor: Actor }) =>
      requestJson<Task>(`/api/tasks/${input.taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: input.status, actor: input.actor }),
      }),
    onSuccess: (_task, input) => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['auditLogs', input.taskId] })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      requestJson<Task>(`/api/tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: (_task, taskId) => {
      if (expandedTaskId === taskId) {
        setExpandedTaskId(null)
      }
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const errorMessage =
    getErrorMessage(tasksQuery.error) ??
    getErrorMessage(auditLogsQuery.error) ??
    getErrorMessage(createTaskMutation.error) ??
    getErrorMessage(updateStatusMutation.error) ??
    getErrorMessage(deleteTaskMutation.error)

  function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createTaskMutation.mutate({
      title,
      description: description.trim() === '' ? undefined : description,
    })
  }

  function handleAdvanceStatus(task: Task) {
    const nextStatus = getNextStatus(task.status)

    if (!nextStatus) {
      return
    }

    updateStatusMutation.mutate({
      taskId: task.id,
      status: nextStatus,
      actor,
    })
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Qonflo assessment</p>
          <h1>Mini Task Manager</h1>
          <p className="subtitle">
            Task status can only move forward: to_do → pending → in_progress →
            done.
          </p>
        </div>

        <label className="actor-picker">
          Actor
          <select value={actor} onChange={(event) => setActor(event.target.value as Actor)}>
            {ACTORS.map((actorOption) => (
              <option key={actorOption} value={actorOption}>
                {actorOption}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="panel">
        <h2>Create task</h2>
        <form className="task-form" onSubmit={handleCreateTask}>
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Prepare invoice"
              maxLength={120}
              required
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional context"
              rows={3}
            />
          </label>

          <button type="submit" disabled={createTaskMutation.isPending}>
            {createTaskMutation.isPending ? 'Creating...' : 'Create task'}
          </button>
        </form>
      </section>

      {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

      <section className="panel">
        <div className="section-title">
          <h2>Active tasks</h2>
          <span>{tasksQuery.data?.length ?? 0} task(s)</span>
        </div>

        {tasksQuery.isLoading ? <p>Loading tasks...</p> : null}

        {!tasksQuery.isLoading && tasksQuery.data?.length === 0 ? (
          <p className="empty-state">No active tasks yet.</p>
        ) : null}

        <div className="task-list">
          {tasksQuery.data?.map((task) => {
            const nextStatus = getNextStatus(task.status)
            const isExpanded = expandedTaskId === task.id

            return (
              <article className="task-card" key={task.id}>
                <div className="task-main">
                  <div>
                    <h3>{task.title}</h3>
                    {task.description ? <p>{task.description}</p> : null}
                    <small>Created {formatDateTime(task.createdAt)}</small>
                  </div>

                  <span className={`status-badge status-${task.status}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>

                <div className="task-actions">
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus(task)}
                    disabled={!nextStatus || updateStatusMutation.isPending}
                  >
                    {nextStatus ? `Move to ${STATUS_LABELS[nextStatus]}` : 'Done'}
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  >
                    {isExpanded ? 'Hide audit log' : 'Show audit log'}
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    disabled={deleteTaskMutation.isPending}
                  >
                    Delete
                  </button>
                </div>

                {isExpanded ? (
                  <div className="audit-log">
                    <h4>Audit log</h4>
                    {auditLogsQuery.isLoading ? <p>Loading audit logs...</p> : null}
                    {!auditLogsQuery.isLoading &&
                    auditLogsQuery.data?.length === 0 ? (
                      <p>No status changes yet.</p>
                    ) : null}
                    <ol>
                      {auditLogsQuery.data?.map((log) => (
                        <li key={log.id}>
                          <strong>{log.actor}</strong> changed{' '}
                          <strong>{log.taskTitle}</strong> from{' '}
                          <code>{log.fromStatus}</code> to{' '}
                          <code>{log.toStatus}</code> at{' '}
                          {formatDateTime(log.createdAt)}
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default App
