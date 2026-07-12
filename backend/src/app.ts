import cors from "cors";
import express from "express";
import helmet from "helmet";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { ApiError, sendError } from "./errors";
import { prisma as defaultPrisma } from "./prisma";
import {
  ACTORS,
  TASK_STATUSES,
  isImmediateForwardTransition,
  type TaskStatus,
} from "./status";

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z
    .string()
    .trim()
    .max(1_000)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

const updateStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
  actor: z.enum(ACTORS),
});

export function createApp(prisma: PrismaClient = defaultPrisma) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ data: { status: "ok" } });
  });

  app.get("/api/tasks", async (_request, response, next) => {
    try {
      const tasks = await prisma.task.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      });

      response.json({ data: tasks });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks", async (request, response, next) => {
    try {
      const input = createTaskSchema.parse(request.body);
      const task = await prisma.task.create({
        data: input,
      });

      response.status(201).json({ data: task });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/tasks/:id/status", async (request, response, next) => {
    try {
      const input = updateStatusSchema.parse(request.body);
      const result = await prisma.$transaction(async (transaction) => {
        const task = await transaction.task.findUnique({
          where: { id: request.params.id },
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

      response.json({
        data: result.task,
        meta: { idempotent: result.idempotent },
      });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/tasks/:id", async (request, response, next) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: request.params.id },
      });

      if (!task) {
        throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");
      }

      if (task.deletedAt) {
        return response.json({ data: task, meta: { idempotent: true } });
      }

      const deletedTask = await prisma.task.update({
        where: { id: task.id },
        data: { deletedAt: new Date() },
      });

      return response.json({
        data: deletedTask,
        meta: { idempotent: false },
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/tasks/:id/audit-logs", async (request, response, next) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      });

      if (!task) {
        throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");
      }

      const auditLogs = await prisma.auditLog.findMany({
        where: { taskId: task.id },
        orderBy: { createdAt: "asc" },
      });

      response.json({ data: auditLogs });
    } catch (error) {
      next(error);
    }
  });

  app.use(sendError);

  return app;
}
