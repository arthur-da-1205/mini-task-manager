# Qonflo Mini Task Manager

A small full-stack task manager focused on clear status transitions and immutable audit history.

## Stack

- Frontend: React, TypeScript, Vite, TanStack Query
- Backend: Node.js, Express, TypeScript, Prisma, SQLite, Zod
- Tests: Vitest, Supertest

## Requirements Covered

- Create tasks with default `to_do` status.
- List active tasks only.
- Move status only through `to_do -> pending -> in_progress -> done`.
- Treat same-status updates as idempotent and do not create audit logs.
- Soft-delete tasks through `deletedAt`.
- Keep audit logs readable after task deletion.
- Store valid status updates and audit logs in one database transaction.

## Running Locally

### Backend

```bash
cd backend
cp .env.example .env
pnpm install
pnpm prisma:migrate
pnpm dev
```

The backend runs on `http://localhost:3000`.

Useful commands:

```bash
pnpm test
pnpm build
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend runs on the Vite dev server, usually `http://localhost:5173`.

If the backend is not on `http://localhost:3000`, set:

```bash
VITE_API_URL=http://localhost:<backend-port>
```

## API

All responses use either `{ "data": ... }` or `{ "error": { "code": "...", "message": "..." } }`.

- `GET /health`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id`
- `GET /api/tasks/:id/audit-logs`

## Architecture

The backend owns all domain rules. The frontend only guides the user toward valid actions, but validation still happens on the server so API consumers cannot skip or reverse statuses.

The main backend flow for status changes is:

1. Validate request body with Zod.
2. Load the task.
3. Reject deleted tasks.
4. Return success without writing if the requested status equals the current status.
5. Reject non-immediate transitions.
6. Update the task and insert the audit log inside a Prisma transaction.

SQLite is used because it is enough for the assessment scope and keeps setup simple.

## Assumptions

- Actor is selected from a predefined list: `john.doe`, `jane.doe`, `qonflo.bot`.
- Creating a task does not create an audit log because the requirement specifically asks for logs on status changes.
- Deleted tasks are hidden from the task list but their audit logs remain available.
- Delete is idempotent when a task is already deleted.

## Trade-offs

- No authentication or authorization was added because it is outside the task scope.
- No shared package was added between frontend and backend to keep the repository simple for a 3–5 hour assessment.
- The UI only exposes the next valid status instead of a free-form status selector. This reduces user error, while backend validation remains the source of truth.
- SQLite is practical for local assessment, but production usage with many users would need stronger concurrency and operational guarantees.

## Audit Log Immutability

The application never exposes update or delete operations for audit logs. Audit logs are only inserted during valid status transitions, and task deletion is soft-delete only, so historical logs are not removed with the task.

For a production system, I would strengthen this with database-level permissions, append-only storage policies, and monitoring around direct database access.

## Highest Risk at Scale

The most risky area is concurrent status updates. The current implementation uses a database transaction, which keeps each valid update and audit log consistent, but high write concurrency would benefit from optimistic locking or a stricter transaction strategy to prevent race conditions around rapid sequential updates.

## First Refactor if the System Grows

I would first extract task status transition logic into a dedicated domain service with focused unit tests. That keeps the API layer thin and makes it easier to reuse the same rules from background jobs, admin tools, or future integrations.

After that, I would introduce pagination/filtering for tasks and audit logs, because unbounded lists become a performance and UX problem quickly.

## AI Usage

AI assisted with implementation structure, code generation, and README drafting. I validated the result by running backend tests and TypeScript builds, and by keeping the domain rules explicit in backend tests so the generated code is checked against the required behavior.
