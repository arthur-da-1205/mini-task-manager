import { requestJson } from '@/lib/http-client'
import type {
  AuditLog,
  CreateTaskInput,
  Task,
  UpdateTaskStatusInput,
} from '../resources/task.types'

export function getTasks() {
  return requestJson<Task[]>('/tasks')
}

export function createTask(input: CreateTaskInput) {
  return requestJson<Task>('/tasks', {
    method: 'POST',
    data: input,
  })
}

export function updateTaskStatus(input: UpdateTaskStatusInput) {
  return requestJson<Task>(`/tasks/${input.taskId}/status`, {
    method: 'PATCH',
    data: { status: input.status, actor: input.actor },
  })
}

export function deleteTask(taskId: string) {
  return requestJson<Task>(`/tasks/${taskId}`, { method: 'DELETE' })
}

export function getTaskAuditLogs(taskId: string) {
  return requestJson<AuditLog[]>(`/tasks/${taskId}/audit-logs`)
}
