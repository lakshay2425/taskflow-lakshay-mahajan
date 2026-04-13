# TaskFlow — Minimal Task Management System

## Overview

**TaskFlow** is a task management system built to demonstrate real-world backend engineering practices: JWT authentication, relational database design, RESTful API patterns, Docker containerization, and comprehensive error handling.

Users can register, log in, create projects, add tasks with custom status and priority, and assign tasks to team members. The system enforces ownership-based access control and includes pagination and filtering on list endpoints.

### Tech Stack

**Backend:**
- **Runtime**: Node.js (v24)
- **Framework**: Express.js v5
- **Database**: PostgreSQL 16
- **Authentication**: JWT (HS256, 24h expiry) with bcrypt password hashing (cost: 12)
- **Validation**: Zod for runtime schema validation
- **Query Builder / Migrations**: Knex.js with explicit up/down migrations

**Deployment:**
- Docker with multi-stage builds for optimized image size
- Docker Compose for local development (PostgreSQL + API in one command)
- Environment-based configuration via `.env`

**Development:**
- Node.js 24-Alpine (lightweight, security-focused base image)
- Watch mode for hot reloading during development
---

## Architecture Decisions

### Project Structure: Feature-Based (Module Folders)

Rather than traditional MVC (Models → Views → Controllers), the codebase uses a **feature-based folder structure**:

```
src/
  auth/              # Authentication feature
  projects/          # Projects feature
  tasks/             # Tasks feature
  config/            # Configuration
  middleware/        # Cross-cutting concerns
  validationSchemas/ # Zod schemas
  database/          # Migrations & seeds
  utils/             # Shared helpers (asyncHandler, dbOperation, returnResponse)
```

**Why:** This structure scales better as features grow independently. Each feature is self-contained (controller → service → DB), making it easier to test, refactor, or extract into microservices later.

### Controller → Service Pattern with Dependency Injection

Controllers handle HTTP concerns only: parse input, validate with Zod, call service, send response. Services handle all business logic and receive `db` as an injected dependency — making them independently testable without mocking globals or module state.

```
Controller: validate → call service(data, userId, { db })
Service:    business logic → DB query → return { success, status, data/message }
Controller: if !success → next(createHttpError) else returnResponse()
```

No `res` or `next` ever enters a service function.

### Authentication: JWT + Bcrypt

- **JWT with HS256**: Stateless authentication — no session database needed
- **24-hour expiry**: Balances security vs. user friction
- **Claims**: `user_id` and `email` for server-side context
- **Bcrypt cost 12**: ~100ms per hash — fast enough for signup, costly enough against brute force

### Access Control: Ownership Middleware

- **Projects**: Owner-only for PATCH/DELETE (`requireProjectOwner` middleware)
- **Tasks**: Project owner OR task creator for PATCH/DELETE (`requireTaskAccess` middleware)

Both middlewares attach `req.project` / `req.task` to the request so downstream service functions don't re-fetch the same row.

### Concurrency: Pessimistic Locking

All mutating operations (PATCH/DELETE on projects and tasks) use `SELECT FOR UPDATE` inside a transaction with a 5-second lock timeout. This prevents the "lost update" problem when two requests modify the same row simultaneously. On timeout, the API returns `409 Conflict` with a retry message rather than silently dropping an update.

PG error code `55P03` (lock timeout) is caught explicitly — not via string matching — for reliability.

### Database: Explicit Migrations Over ORM Magic

Used Knex migrations (not auto-migration or Prisma) because:
- **Auditable**: Every schema change is in version control
- **Reversible**: Down migrations allow safe rollback in production
- **SQL control**: Complex queries and optimizations not abstracted away
- **Team safety**: Explicit migration review before merge

### Enums via CHECK Constraints

Status (`todo | in_progress | done`) and Priority (`low | medium | high`) are enforced at the database level via CHECK constraints, preventing invalid values even via direct DB queries — not just at the application layer.

### Validation: Zod Schemas with Allowlists

Centralized Zod schemas validate all input. Separate schemas for create vs. update operations. Update controllers additionally filter `req.body` against an explicit `ALLOWED_UPDATE_FIELDS` array before Zod runs — preventing mass assignment of fields the user shouldn't control.

### UUID Validation Middleware

A `validateUUID` middleware checks UUID v4 format on all `:id` params before any DB query runs. PostgreSQL generates UUID v4 via `gen_random_uuid()` — the format is predictable and validatable, same principle as MongoDB ObjectId validation. This prevents malformed IDs from reaching the database and returns a clean 400 instead of a cryptic PG type error.

### What Was Intentionally Left Out

| Feature             | Reason                                                 |
| ------------------- | ------------------------------------------------------ |
| Frontend            | Backend-only role; Postman collection provided instead |
| Real-time updates   | Synchronous REST sufficient for MVP                    |
| Soft deletes        | Hard deletes simpler; audit trail not in spec          |
| Rate limiting       | Out of scope for MVP; noted below as future work       |
| Email notifications | No email integration in spec                           |

---

## Running Locally

### Prerequisites

- **Docker** and **Docker Compose** installed ([install here](https://docs.docker.com/get-docker/))
- That's it — no Node.js, PostgreSQL, or manual setup needed

### Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/lakshay2425/taskflow-lakshay-mahajan
cd taskflow-lakshay-mahajan

# 2. Create .env file from template
cp .env.example .env

# 3. Start the full stack (PostgreSQL + API)
docker compose up

# The system will automatically:
# - Start PostgreSQL
# - Wait for DB to be healthy
# - Run all migrations
# - Seed test data (1 user, 1 project, 3 tasks)
# - Start API server on http://localhost:3000

# 4. Verify it's running
curl http://localhost:3000/health
# Expected: {"message":"Running"}
```

### Environment Variables

See `.env.example` for all variables. Key ones:

```
PORT=3000
NODE_ENV=development
DB_URI=postgres://postgres:postgres@db:5432/taskflow_db
JWT_SECRET=your_super_secret_key_change_in_production
BCRYPT_SALT_ROUNDS=12
FRONTEND_URL=http://localhost:3000
BYPASS_AUTH=false
```

### Troubleshooting

**API returns 500 on startup:**
- Ensure `.env` has all required variables set
- Check logs: `docker compose logs api`

**"Connection refused" on port 5432:**
- PostgreSQL may still be starting: `docker compose logs db`
- Restart: `docker compose down && docker compose up`

**Stale JWT after DB reset:**
- Re-register or re-login to get a fresh token — old tokens reference deleted users

---

## Running Migrations

Migrations and seeds run **automatically** on container start.

### Manual migration commands (inside running container):

```bash
# Run latest migrations
docker compose exec api npx knex migrate:latest

# Roll back one migration
docker compose exec api npx knex migrate:rollback

# Rollback then re-run (full reset)
docker compose exec api npx knex migrate:rollback && docker compose exec api npx knex migrate:latest

# Re-run seeds
docker compose exec api npx knex seed:run
```

### Full data reset (wipes volume):

```bash
docker compose down -v   # removes named volume
docker compose up        # starts fresh, migrations + seeds run automatically
```

---

## Test Credentials

After `docker compose up`, the database is pre-seeded with:

```
Email:    test@example.com
Password: password123
```

This user owns a test project with 3 tasks in different statuses (todo, in_progress, done).

### Postman Collection

**[TaskFlow API Collection](https://www.postman.com/solo88-4656/taskflow/request/37161219-6b9d708f-9b42-4267-8dee-74875fc687ba)**

Set collection variables:
- `baseURL` → `http://localhost:3000/api`
- `token` → JWT from login response

The collection covers: auth, project CRUD, task CRUD, filters, stats, and error scenarios (invalid UUID, missing token, forbidden access, validation errors).

---

## API Reference

**Base URL:** `http://localhost:3000/api`

All endpoints except `/auth/*` require `Authorization: Bearer <token>`.

---

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}

201 Created
{
  "message": "User signed up successfully",
  "jwtToken": "eyJhbGci..."
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

200 OK
{
  "message": "User logged in successfully",
  "jwtToken": "eyJhbGci..."
}
```

---

### Projects

#### List Projects (paginated)
```http
GET /projects?page=1&limit=10
Authorization: Bearer <token>

200 OK
{
  "message": "Projects fetched successfully",
  "data": {
    "projects": [ { "id": "uuid", "name": "...", "owner_id": "uuid", "created_at": "..." } ],
    "pagination": { "total": 5, "page": 1, "limit": 10, "pages": 1 }
  }
}
```

Returns projects the user owns **or** has been assigned tasks in.

#### Create Project
```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "New Project", "description": "Optional description" }

201 Created
{
  "message": "Project created successfully",
  "data": { "id": "uuid", "name": "New Project", "owner_id": "uuid", "created_at": "..." }
}
```

#### Get Project + Tasks
```http
GET /projects/:id
Authorization: Bearer <token>

200 OK
{
  "message": "Project fetched successfully",
  "data": {
    "id": "uuid", "name": "...", "owner_id": "uuid",
    "tasks": [
      { "id": "uuid", "title": "...", "status": "todo", "priority": "high", "created_by": "uuid", ... }
    ]
  }
}
```

#### Update Project (owner only)
```http
PATCH /projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Updated Name", "description": "Updated description" }

200 OK
{ "message": "Project updated successfully", "data": { ... } }
```

Allowed fields: `name`, `description` only. Extra fields are stripped silently.

#### Delete Project (owner only)
```http
DELETE /projects/:id
Authorization: Bearer <token>

204 No Content
```

All tasks in the project are deleted automatically via CASCADE.

#### Project Stats (owner only)
```http
GET /projects/:id/stats
Authorization: Bearer <token>

200 OK
{
  "message": "Project stats fetched successfully",
  "data": {
    "by_status": [ { "status": "todo", "count": "2" }, { "status": "done", "count": "1" } ],
    "by_assignee": [ { "assignee_id": "uuid", "count": "3" } ]
  }
}
```

---

### Tasks

#### List Tasks (paginated + filtered)
```http
GET /projects/:id/tasks?status=todo&assignee=<uuid>&page=1&limit=20
Authorization: Bearer <token>

200 OK
{
  "message": "Tasks fetched successfully",
  "data": {
    "tasks": [ { "id": "uuid", "title": "...", "status": "todo", "priority": "medium", "created_by": "uuid", ... } ],
    "pagination": { "total": 10, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

Filter options: `?status=todo|in_progress|done`, `?assignee=<uuid>`

#### Create Task
```http
POST /projects/:id/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Design UI",
  "description": "Create wireframes",
  "priority": "medium",
  "assignee_id": "uuid",
  "due_date": "2026-05-01"
}

201 Created
{
  "message": "Task created successfully",
  "data": { "id": "uuid", "title": "Design UI", "status": "todo", "created_by": "uuid", ... }
}
```

Defaults: `status = todo`, `priority = medium`

#### Update Task (project owner or task creator)
```http
PATCH /tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "status": "in_progress",
  "priority": "high",
  "assignee_id": "uuid",
  "due_date": "2026-06-01"
}

200 OK
{ "message": "Task updated successfully", "data": { ... } }
```

Allowed fields: `title`, `description`, `status`, `priority`, `assignee_id`, `due_date`

#### Delete Task (project owner or task creator)
```http
DELETE /tasks/:id
Authorization: Bearer <token>

204 No Content
```

---

### Error Responses

```json
// 400 — Validation failed
{ "error": "validation failed", "fields": { "title": "is required" } }

// 401 — Missing or invalid token
{ "error": "No token provided" }

// 403 — Valid token, wrong permissions
{ "error": "You do not have permission to modify this project" }

// 404 — Resource not found
{ "error": "Project not found" }

// 409 — Concurrent modification (lock timeout)
{ "error": "Resource is currently being modified, please retry" }

// 500 — Internal server error
{ "error": "Internal server error" }
```

---

## What I'd Do With More Time

### Already Implemented Beyond Basic Requirements

- **Pessimistic Locking** — `SELECT FOR UPDATE` with 5s lock timeout on all mutating operations, returning `409 Conflict` on timeout with PG error code `55P03`
- **UUID Validation Middleware** — validates UUID v4 format before any DB query, same principle as MongoDB ObjectId validation
- **Ownership Middleware** — `requireProjectOwner` and `requireTaskAccess` as reusable middleware, keeping controllers free of auth logic
- **Dependency Injection** — services receive `{ db }` as a parameter, making them independently testable without mocking module globals
- **Allowlist-based Update Filtering** — `ALLOWED_UPDATE_FIELDS` array strips non-whitelisted fields before Zod validation, preventing mass assignment
- **Bonus Stats Endpoint** — `GET /projects/:id/stats` with task counts by status and assignee
- **Pagination** — offset-based pagination on all list endpoints with total/pages metadata

### High Priority
1. **Comprehensive Test Suite** (`Jest` + `Supertest`)
   - Integration tests for all endpoints (happy path + error cases)
   - Unit tests for service layer and validation schemas
   - Target 80%+ coverage on critical auth and task flows

2. **Idempotency for POST Routes**
   - Add `Idempotency-Key` header support on `POST /projects` and `POST /tasks`
   - Store idempotency keys with response in a short-TTL cache (Redis)
   - Prevents duplicate projects/tasks if client retries a failed request
   - Standard practice for payment and task APIs at scale

3. **Assignee Validation** — currently `assignee_id` isn't verified to exist in `users` table before insert; would add a FK existence check in the service layer

4. **Email Normalization** — `toLowerCase()` before insert to prevent `User@Example.com` and `user@example.com` as separate accounts; would also add a `LOWER(email)` unique index at DB level

5. **Rate Limiting** — apply `express-rate-limit` to auth endpoints specifically (`/auth/login`, `/auth/register`) to prevent brute force

### Medium Priority

4. **Cursor-based Pagination** — current offset pagination degrades on large datasets; cursor pagination would be more performant at scale

5. **Soft Deletes** — `deleted_at` timestamp instead of hard delete to maintain audit trail

6. **Project Membership Model** — expand beyond owner-only to support invited members with roles (viewer | editor | admin)

7. **Structured Logging** — add request/response logging with request IDs, log levels, and file output for production debugging

### Production Hardening

- RS256 asymmetric JWT (separate public/private keys) over HS256
- Redis caching for frequently accessed project/stats queries
- API versioning (`/api/v1/`) for safe future changes
- Connection pool tuning based on load testing results
- APM monitoring (Datadog or New Relic)
- Automated PostgreSQL backups

### Exploring Further

- Deeper Knex exploration and evaluating alternatives (Drizzle ORM, raw `pg` driver) for better TypeScript support and query composability at scale

---

## Links

- **GitHub**: [lakshay2425/taskflow-lakshay-mahajan](https://github.com/lakshay2425/taskflow-lakshay-mahajan)
- **Postman Collection**: [TaskFlow API](https://www.postman.com/solo88-4656/taskflow/request/37161219-6b9d708f-9b42-4267-8dee-74875fc687ba)
