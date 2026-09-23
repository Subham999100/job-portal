# Phase 00 — Architecture Decision Records (ADRs)

This document records the foundational technology and architectural decisions made during Phase 00.

---

## ADR 01: Architecture Style — Modular Monolith

- **Technology**: Modular Monolith Architecture Pattern
- **Purpose**: Structure the backend codebase to support 15+ business domains within a single deployable unit while maintaining strict module encapsulation.
- **Why it is needed**: Microservices introduce distributed transactions, complex network latency, multiple CI/CD pipelines, service meshes, and significant operational overhead that slows down development and increases failure modes. A modular monolith allows rapid development, transactional consistency in PostgreSQL, and simple deployment.
- **Alternatives considered**:
  - Independent Microservices
  - Layered / Traditional Monolith (spaghetti architecture without module encapsulation)
- **Tradeoffs**: Requires engineering discipline to enforce module boundaries and prevent unauthorized cross-module coupling.
- **Decision**: Adopt a Modular Monolith. Individual modules may be extracted into microservices in the future only if real scale and operational requirements justify it.

---

## ADR 02: Backend Framework — NestJS (Express Platform)

- **Technology**: NestJS Framework (v11) with Express Engine
- **Purpose**: Core application runtime framework and dependency injection container.
- **Why it is needed**: NestJS provides native architectural structures (`@Module()`, dependency injection, lifecycle hooks, interceptors, pipes, filters) that directly enforce the Modular Monolith pattern out-of-the-box.
- **Alternatives considered**:
  - Standalone Fastify
  - Standalone Express
- **Tradeoffs**: Introduces framework conventions and TypeScript decorator overhead. However, the benefits in standardization, maintainability, and guardrails across multiple engineering teams far outweigh the minimal abstraction overhead.
- **Decision**: Use NestJS.

---

## ADR 03: Data Access & ORM — Prisma ORM

- **Technology**: Prisma ORM (v6) with PostgreSQL
- **Purpose**: Database schema definition, automated migrations, and type-safe query generation.
- **Why it is needed**: Provides a declarative single source of truth for the schema (`schema.prisma`), robust migration management (`prisma migrate dev`), compile-time type safety for database queries, and clean integration into NestJS lifecycle hooks.
- **Alternatives considered**:
  - Drizzle ORM
  - TypeORM
- **Tradeoffs**: Prisma utilizes an engine layer and generates client types via code generation, but offers the cleanest migration workflow and declarative schema documentation for complex recruitment domain entities.
- **Decision**: Use Prisma ORM. For Phase 00, only the datasource connection and database service lifecycle are scaffolded; domain tables are deferred to Phase 03/04.

---

## ADR 04: Configuration & Validation Strategy — class-validator & class-transformer

- **Technology**: `class-validator` and `class-transformer`
- **Purpose**: Environment variable validation at bootstrap and incoming request DTO validation.
- **Why it is needed**: Prevents silent runtime failures by enforcing fail-fast validation when the application boots. Guarantees that invalid or missing environment variables halt process startup immediately with descriptive messages.
- **Alternatives considered**:
  - Zod
  - Joi
- **Tradeoffs**: Decorator-based syntax requires `reflect-metadata`, which is already part of NestJS's core architecture.
- **Decision**: Use `class-validator` and `class-transformer` for both environment validation and DTO request validation. In production (`NODE_ENV=production`), wildcard `CORS_ORIGIN=*` is explicitly forbidden by startup validation.

---

## ADR 05: Centralized Error Handling & Security Model

- **Technology**: Centralized NestJS Exception Filters (`HttpExceptionFilter` & `AllExceptionsFilter`)
- **Purpose**: Normalize all API error responses and protect internal infrastructure details from information leakage.
- **Why it is needed**: Without centralized filtering, unhandled exceptions can leak database connection strings, SQL queries, or internal stack traces to clients, presenting severe security vulnerabilities.
- **Alternatives considered**:
  - Per-controller try/catch blocks
  - Standard Express error handlers
- **Tradeoffs**: Custom filters require maintaining consistent error payload contracts across all modules.
- **Decision**: Implement a two-tiered filter strategy: `HttpExceptionFilter` for client-facing status codes and `AllExceptionsFilter` as a catch-all that masks internal details in production while recording full context server-side with correlation IDs.

---

## ADR 06: Request Correlation and Structured Logging — Correlation ID Middleware

- **Technology**: In-house Express Middleware utilizing `crypto.randomUUID()` and HTTP Headers
- **Purpose**: Attach a consistent `X-Correlation-Id` to every incoming request and response for request correlation and structured logging.
- **Why it is needed**: In a modular monolith handling concurrent requests, matching client errors to server logs requires a deterministic correlation token.
- **Alternatives considered**:
  - Relying on external APM agents only
  - Standard timestamps without unique IDs
- **Tradeoffs**: Adds a header to each HTTP transaction and requires propagation through logs.
- **Decision**: Implement `CorrelationIdMiddleware` and integrate the ID into all logs, error responses, and HTTP response headers. Note: this provides request correlation and structured logging, not distributed tracing.

---

## ADR 07: Health Check Strategy — Canonical GET /health with Decoupled Reporting

- **Technology**: NestJS Controller (`HealthController`) & `HealthService`
- **Purpose**: Expose a single canonical health check endpoint (`GET /health`) for container orchestrators and monitoring tools.
- **Why it is needed**: Container orchestrators require a predictable HTTP endpoint to verify application liveness. However, conflating application process uptime with database availability can cause cascading restart loops during transient database maintenance.
- **Alternatives considered**:
  - Multiple separate probe routes (`/health`, `/api/v1/health`, `/health/liveness`)
  - Reporting overall status as OK even when database ping fails
- **Tradeoffs**: Requires consumers to inspect the payload's `database.status` for dependency health rather than relying solely on the HTTP 200 status code for dependency verification.
- **Decision**: Provide single canonical `GET /health`. Decouple `application.status` from `database.status`. Database is only reported as `connected` when verified via an active query ping; otherwise reports `disconnected` or `unconfigured`.
