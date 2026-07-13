export type TaskStatus = 'to_do' | 'pending' | 'in_progress' | 'done'

export type Actor = 'john.doe' | 'jane.doe' | 'qonflo.bot'

export type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type AuditLog = {
  id: string
  taskId: string
  taskTitle: string
  actor: string
  fromStatus: TaskStatus
  toStatus: TaskStatus
  createdAt: string
}

export type CreateTaskInput = {
  title: string
  description?: string
}

export type UpdateTaskStatusInput = {
  taskId: string
  status: TaskStatus
  actor: Actor
}
