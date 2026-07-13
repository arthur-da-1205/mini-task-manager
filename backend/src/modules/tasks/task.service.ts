import type { PrismaClient } from "@prisma/client";
import { ApiError } from "../../common/errors/api-error";
import {
  isImmediateForwardTransition,
  type Actor,
  type TaskStatus,
} from "./task.constants";

type CreateTaskInput = {
  title: string;
  description?: string;
};

type UpdateTaskStatusInput = {
  status: TaskStatus;
  actor: Actor;
};

export class TaskService {
  constructor(private readonly prisma: PrismaClient) {}

  listActiveTasks() {
    return this.prisma.task.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  createTask(input: CreateTaskInput) {
    return this.prisma.task.create({
      data: input,
    });
  }

  updateStatus(taskId: string, input: UpdateTaskStatusInput) {
    return this.prisma.$transaction(async (transaction) => {
      const task = await transaction.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");
      }

      if (task.deletedAt) {
        throw new ApiError(409, "TASK_DELETED", "Deleted tasks cannot be updated");
      }

      if (task.status === input.status) {
        return { task, idempotent: true };
      }

      const currentStatus = task.status as TaskStatus;

      if (!isImmediateForwardTransition(currentStatus, input.status)) {
        throw new ApiError(
          409,
          "INVALID_STATUS_TRANSITION",
          `Invalid transition: ${task.status} -> ${input.status}`,
        );
      }

      const updatedTask = await transaction.task.update({
        where: { id: task.id },
        data: { status: input.status },
      });

      await transaction.auditLog.create({
        data: {
          taskId: task.id,
          taskTitle: task.title,
          actor: input.actor,
          fromStatus: task.status,
          toStatus: input.status,
        },
      });

      return { task: updatedTask, idempotent: false };
    });
  }

  async deleteTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");
    }

    if (task.deletedAt) {
      return { task, idempotent: true };
    }

    const deletedTask = await this.prisma.task.update({
      where: { id: task.id },
      data: { deletedAt: new Date() },
    });

    return { task: deletedTask, idempotent: false };
  }

  async getAuditLogs(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");
    }

    return this.prisma.auditLog.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
    });
  }
}
