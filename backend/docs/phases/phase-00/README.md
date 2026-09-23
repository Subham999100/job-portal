# Phase 00 — Backend Foundation

## 1. Objective
Establish the engineering foundation for a large-scale recruitment platform backend. This foundation provides architectural patterns, module boundaries, configuration validation, centralized error handling, structured logging, request correlation, database integration direction, and the canonical health check endpoint.

---

## 2. Scope

### In Scope for Phase 00 (Current Implementation)
- Repository organization and Modular Monolith baseline under `backend/`.
- NestJS application bootstrap and graceful lifecycle shutdown hooks.
- Strongly-typed environment configuration and startup validation (including production CORS guardrails).
- Unified REST API error handling and production security masking.
- Request correlation middleware (`X-Correlation-Id`) and structured HTTP request logging.
- Canonical health check endpoint (`GET /health`) with decoupled application and database reporting.
- Database integration direction with Prisma ORM (datasource setup, lifecycle hooks).
- Comprehensive unit and end-to-end test suite.
- Architecture documentation and Architecture Decision Records (ADRs).

### Explicitly Out of Scope for Phase 00 (Future Architecture)
- Business domain functionality (Auth, Users, Candidates, Companies, Jobs, Applications, ATS, etc.).
- Relational domain database tables and entities (scheduled for Phase 03/04).
- External infrastructure adapters (Redis, BullMQ, OpenSearch, S3 Object Storage, Email, Payments).
- Reverse proxy or API gateway deployments.
- Frontend application code.

---

## 3. Directory Structure

```text
backend/
├── src/
│   ├── main.ts                         # Application entrypoint & bootstrap
│   ├── app.module.ts                   # Root application module
│   ├── config/                         # Configuration and environment validation
│   ├── common/                         # Common filters, middleware, pipes, errors, decorators
│   ├── database/                       # Prisma client wrapper and database module
│   └── health/                         # Canonical health check controller and service
├── prisma/
│   └── schema.prisma                   # PostgreSQL datasource configuration
├── test/
│   ├── unit/                           # Isolated unit tests
│   └── e2e/                            # Supertest end-to-end tests
├── docs/                               # System architecture & ADRs
├── .env.example                        # Template for environment configuration
└── package.json                        # Scripts and dependencies
```

---

## 4. Setup & Installation

### Prerequisites
- Node.js (v20+ or v22+ LTS)
- npm (v10+)
- PostgreSQL (optional for Phase 00; health check reports unconfigured or disconnected cleanly without crashing)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```
Inspect `.env` and adjust `PORT`, `NODE_ENV`, or `DATABASE_URL` as appropriate for your environment.

---

## 5. Run Commands

### Development Mode (with ts-node)
```bash
npm run start:dev
```

### Production Build & Run
```bash
npm run build
npm run start:prod
```

---

## 6. Test Commands

### Run Unit Tests
```bash
npm run test
```

### Run End-to-End Tests
```bash
npm run test:e2e
```

### Run Test Coverage
```bash
npm run test:cov
```

---

## 7. Canonical Health Endpoint

### Endpoint
```http
GET /health
```

**Response Payload (200 OK):**
```json
{
  "application": {
    "status": "ok",
    "uptimeSeconds": 42,
    "timestamp": "2026-09-23T10:15:30.000Z",
    "environment": "development",
    "version": "0.1.0"
  },
  "database": {
    "status": "unconfigured"
  }
}
```

### Decoupled Health Design:
- **Application Health**: Reflects whether the Node.js HTTP server is running and accepting traffic.
- **Database Health**: Reflects actual checked database connectivity. PostgreSQL is **only** reported as `connected` when an active ping succeeds (`SELECT 1`). If `DATABASE_URL` is omitted, it reports `unconfigured`. If unreachable, it reports `disconnected` with the specific error message.

---

## 8. Environment Configuration Reference

| Variable | Description | Allowed Values | Development Behavior | Production Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Application environment | `development`, `production`, `test` | `development` | Strict security enforcement |
| `PORT` | HTTP port | Number (1 - 65535) | `3000` | As provided by environment |
| `API_PREFIX` | REST API prefix | String | `api/v1` | `api/v1` |
| `LOG_LEVEL` | Logging verbosity | `error`, `warn`, `info`, `debug`, `verbose` | `info` | `info` |
| `CORS_ORIGIN`| Allowed CORS origins | Explicit origins or `*` in dev | Accepts `*` or localhost | **Wildcard `*` is strictly forbidden** by startup validation |
| `DATABASE_URL` | PostgreSQL connection string | Valid URI | Optional | Target database URL |

---

## 9. Completed Work
- [x] Initialized clean backend repository layout.
- [x] Configured TypeScript strict mode and NestJS runtime.
- [x] Established fail-fast environment validation using `class-validator` (with production CORS restrictions).
- [x] Built application bootstrap in `src/main.ts` with graceful shutdown hooks.
- [x] Created `HttpExceptionFilter` and `AllExceptionsFilter` with production error masking.
- [x] Implemented `CorrelationIdMiddleware` for request correlation and structured logging.
- [x] Implemented structured HTTP request logging with credential sanitization.
- [x] Built canonical health check endpoint (`GET /health`) with decoupled application and dependency health.
- [x] Configured Prisma ORM PostgreSQL datasource and `PrismaService` connection lifecycle.
- [x] Authored architectural blueprints, ADRs, and permanent engineering contract (`AGENTS.md`).
- [x] Implemented unit and E2E test suites verifying core behavior.

---

## 10. Known Limitations
- Domain models and database tables are intentionally absent in Phase 00 (scheduled for Phase 03/04).
- When PostgreSQL is offline, `database.status` reports `unconfigured` or `disconnected`; the application process remains alive for isolated API verification.

---

## 11. Next Phase: Phase 01 — Authentication & Authorization
Phase 01 will implement:
- User credential hashing (Argon2 / bcrypt)
- JWT access and refresh token issuing and rotation
- Role-Based Access Control (RBAC) guards (Candidate, Recruiter, Admin)
- Session lifecycle and token revocation
