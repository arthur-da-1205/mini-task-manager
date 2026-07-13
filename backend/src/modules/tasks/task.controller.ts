import type { NextFunction, Request, Response } from "express";
import { createTaskSchema, updateTaskStatusSchema } from "./task.schemas";
import type { TaskService } from "./task.service";

type TaskParams = {
  id: string;
};

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  listTasks = async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const tasks = await this.taskService.listActiveTasks();
      response.json({ data: tasks });
    } catch (error) {
      next(error);
    }
  };

  createTask = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const input = createTaskSchema.parse(request.body);
      const task = await this.taskService.createTask(input);

      response.status(201).json({ data: task });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (
    request: Request<TaskParams>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const input = updateTaskStatusSchema.parse(request.body);
      const result = await this.taskService.updateStatus(request.params.id, input);

      response.json({
        data: result.task,
        meta: { idempotent: result.idempotent },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (
    request: Request<TaskParams>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await this.taskService.deleteTask(request.params.id);

      response.json({
        data: result.task,
        meta: { idempotent: result.idempotent },
      });
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (
    request: Request<TaskParams>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const auditLogs = await this.taskService.getAuditLogs(request.params.id);
      response.json({ data: auditLogs });
    } catch (error) {
      next(error);
    }
  };
}
