import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { TaskController } from "./task.controller";
import { TaskService } from "./task.service";

export function createTaskRouter(prisma: PrismaClient) {
  const router = Router();
  const taskService = new TaskService(prisma);
  const taskController = new TaskController(taskService);

  router.get("/tasks", taskController.listTasks);
  router.post("/tasks", taskController.createTask);
  router.patch("/tasks/:id/status", taskController.updateStatus);
  router.delete("/tasks/:id", taskController.deleteTask);
  router.get("/tasks/:id/audit-logs", taskController.getAuditLogs);

  return router;
}
