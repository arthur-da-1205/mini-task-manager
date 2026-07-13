import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTask,
  deleteTask,
  getTaskAuditLogs,
  getTasks,
  updateTaskStatus,
} from './task.api'

export const taskQueryKeys = {
  all: ['tasks'] as const,
  auditLogs: (taskId: string | null) => ['tasks', taskId, 'audit-logs'] as const,
}

export function useTasksQuery() {
  return useQuery({
    queryKey: taskQueryKeys.all,
    queryFn: getTasks,
  })
}

export function useTaskAuditLogsQuery(taskId: string | null) {
  return useQuery({
    queryKey: taskQueryKeys.auditLogs(taskId),
    queryFn: () => getTaskAuditLogs(taskId ?? ''),
    enabled: taskId !== null,
  })
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    },
  })
}

export function useUpdateTaskStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTaskStatus,
    onSuccess: (_task, input) => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.auditLogs(input.taskId),
      })
    },
  })
}

export function useDeleteTaskMutation(onDeleted?: (taskId: string) => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (_task, taskId) => {
      onDeleted?.(taskId)
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    },
  })
}
