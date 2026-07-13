import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Express } from "express";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";

let app: Express;
let prisma: PrismaClient | undefined;
let tempDir: string;

async function createTask(title = "Prepare Invoice") {
  const response = await request(app)
    .post("/api/tasks")
    .send({ title, description: "Monthly finance task" })
    .expect(201);

  return response.body.data as { id: string; status: string; updatedAt: string };
}

function updateStatus(taskId: string, status: string, actor = "john.doe") {
  return request(app)
    .patch(`/api/tasks/${taskId}/status`)
    .send({ status, actor });
}

beforeAll(async () => {
  tempDir = mkdtempSync(join(tmpdir(), "qonflo-backend-test-"));
  const databaseUrl = `file:${join(tempDir, "test.db")}`;

  execFileSync("pnpm", ["prisma", "migrate", "deploy"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });

  prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  app = createApp(prisma);
});

beforeEach(async () => {
  if (!prisma) {
    throw new Error("Prisma test client is not initialized");
  }

  await prisma.auditLog.deleteMany();
  await prisma.task.deleteMany();
});

afterAll(async () => {
  await prisma?.$disconnect();
  rmSync(tempDir, { recursive: true, force: true });
});

describe("task API", () => {
  it("creates tasks in to_do and lists only active tasks", async () => {
    const task = await createTask();

    expect(task.status).toBe("to_do");

    const listResponse = await request(app).get("/api/tasks").expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].id).toBe(task.id);
  });

  it("rejects skipped status transitions without creating audit logs", async () => {
    const task = await createTask();

    const response = await updateStatus(task.id, "in_progress").expect(409);

    expect(response.body.error.code).toBe("INVALID_STATUS_TRANSITION");

    const auditResponse = await request(app)
      .get(`/api/tasks/${task.id}/audit-logs`)
      .expect(200);

    expect(auditResponse.body.data).toHaveLength(0);
  });

  it("rejects backward status transitions", async () => {
    const task = await createTask();

    await updateStatus(task.id, "pending").expect(200);

    const response = await updateStatus(task.id, "to_do").expect(409);

    expect(response.body.error.code).toBe("INVALID_STATUS_TRANSITION");

    const auditResponse = await request(app)
      .get(`/api/tasks/${task.id}/audit-logs`)
      .expect(200);

    expect(auditResponse.body.data).toHaveLength(1);
    expect(auditResponse.body.data[0]).toMatchObject({
      fromStatus: "to_do",
      toStatus: "pending",
    });
  });

  it("rejects unknown actors before writing audit logs", async () => {
    const task = await createTask();

    const response = await updateStatus(task.id, "pending", "unknown.user").expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");

    const auditResponse = await request(app)
      .get(`/api/tasks/${task.id}/audit-logs`)
      .expect(200);

    expect(auditResponse.body.data).toHaveLength(0);
  });

  it("treats updates to the current status as idempotent", async () => {
    const task = await createTask();

    const response = await updateStatus(task.id, "to_do").expect(200);

    expect(response.body.meta.idempotent).toBe(true);
    expect(response.body.data.updatedAt).toBe(task.updatedAt);

    const auditResponse = await request(app)
      .get(`/api/tasks/${task.id}/audit-logs`)
      .expect(200);

    expect(auditResponse.body.data).toHaveLength(0);
  });

  it("updates status and writes audit log atomically for valid transitions", async () => {
    const task = await createTask();

    const response = await updateStatus(task.id, "pending", "jane.doe").expect(200);

    expect(response.body.data.status).toBe("pending");
    expect(response.body.meta.idempotent).toBe(false);

    const auditResponse = await request(app)
      .get(`/api/tasks/${task.id}/audit-logs`)
      .expect(200);

    expect(auditResponse.body.data).toMatchObject([
      {
        taskId: task.id,
        taskTitle: "Prepare Invoice",
        actor: "jane.doe",
        fromStatus: "to_do",
        toStatus: "pending",
      },
    ]);
  });

  it("soft deletes tasks while keeping audit logs readable", async () => {
    const task = await createTask();
    await updateStatus(task.id, "pending").expect(200);

    await request(app).delete(`/api/tasks/${task.id}`).expect(200);

    const listResponse = await request(app).get("/api/tasks").expect(200);
    expect(listResponse.body.data).toHaveLength(0);

    await updateStatus(task.id, "in_progress").expect(409);

    const auditResponse = await request(app)
      .get(`/api/tasks/${task.id}/audit-logs`)
      .expect(200);

    expect(auditResponse.body.data).toHaveLength(1);
    expect(auditResponse.body.data[0].toStatus).toBe("pending");
  });

  it("returns audit logs in chronological ascending order", async () => {
    const task = await createTask();

    await updateStatus(task.id, "pending", "john.doe").expect(200);
    await updateStatus(task.id, "in_progress", "jane.doe").expect(200);
    await updateStatus(task.id, "done", "qonflo.bot").expect(200);

    const auditResponse = await request(app)
      .get(`/api/tasks/${task.id}/audit-logs`)
      .expect(200);

    expect(
      auditResponse.body.data.map(
        (log: { fromStatus: string; toStatus: string }) =>
          `${log.fromStatus}->${log.toStatus}`,
      ),
    ).toEqual(["to_do->pending", "pending->in_progress", "in_progress->done"]);

    const createdAtValues = auditResponse.body.data.map(
      (log: { createdAt: string }) => new Date(log.createdAt).getTime(),
    );
    expect(createdAtValues).toEqual([...createdAtValues].sort((left, right) => left - right));
  });
});
