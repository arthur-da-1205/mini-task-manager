import type { Actor, TaskStatus } from './task.types'

export const TASK_STATUSES: TaskStatus[] = [
  'to_do',
  'pending',
  'in_progress',
  'done',
]

export const ACTORS: Actor[] = ['john.doe', 'jane.doe', 'qonflo.bot']

export const STATUS_LABELS: Record<TaskStatus, string> = {
  to_do: 'To do',
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
}
