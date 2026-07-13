import { z } from "zod";
import { ACTORS, TASK_STATUSES } from "./task.constants";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z
    .string()
    .trim()
    .max(1_000)
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
  actor: z.enum(ACTORS),
});
