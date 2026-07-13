import { TASK_STATUSES } from '../resources/task.constants'
import type { TaskStatus } from '../resources/task.types'

export function getNextTaskStatus(status: TaskStatus) {
  const currentIndex = TASK_STATUSES.indexOf(status)
  return TASK_STATUSES[currentIndex + 1] ?? null
}
