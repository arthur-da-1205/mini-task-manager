export const TASK_STATUSES = ["to_do", "pending", "in_progress", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const ACTORS = ["john.doe", "jane.doe", "qonflo.bot"] as const;

export type Actor = (typeof ACTORS)[number];

export function getNextStatus(status: TaskStatus): TaskStatus | null {
  const currentIndex = TASK_STATUSES.indexOf(status);
  return TASK_STATUSES[currentIndex + 1] ?? null;
}

export function isImmediateForwardTransition(
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
): boolean {
  return getNextStatus(fromStatus) === toStatus;
}
