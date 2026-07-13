import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "./lib/prisma";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { createTaskRouter } from "./modules/tasks/task.routes";

export function createApp(prisma: PrismaClient = defaultPrisma) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ data: { status: "ok" } });
  });

  app.use("/api", createTaskRouter(prisma));

  app.use(errorHandler);

  return app;
}
