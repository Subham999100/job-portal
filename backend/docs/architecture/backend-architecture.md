# Backend Architecture: Recruitment Platform Modular Monolith

## 1. Executive Summary

This document details the architectural design for the recruitment platform backend. The system is engineered as a **Modular Monolith** using Node.js, TypeScript, NestJS, and PostgreSQL. It delivers enterprise-grade maintainability, performance, and security while avoiding the premature complexity, network latency, and operational overhead of microservices.

---

## 2. Architecture: Current Implementation vs. Future Architecture

### 2.1 Current Implementation (Phase 00 Foundation)

Phase 00 establishes only the core backend engineering baseline.

```text
HTTP Client (REST / JSON)
       ↓
Backend Modular Monolith (NestJS + TypeScript)
  ├── Cross-Cutting Pipeline
  │     ├── Request Correlation (X-Correlation-Id)
  │     ├── Structured Request Logger
  │     ├── Platform Validation Pipe
  │     └── Centralized Exception Filters
  ├── Core Modules
  │     ├── AppConfigModule (Validated Environment Config)
  │     ├── DatabaseModule (PrismaService Scaffolding)
  │     └── HealthModule (Canonical GET /health Probe)
       ↓
PostgreSQL Database (Integration Layer Scaffolding)
```

**Currently Implemented:**
- **Runtime & Framework**: Node.js LTS, TypeScript (strict mode), NestJS (Express adapter).
- **Configuration**: Strongly-typed environment schema with fail-fast validation and production CORS guardrails.
- **Error Handling**: Uniform JSON error responses; internal database details and stack traces masked in production.
- **Request Correlation & Structured Logging**: Inbound requests tagged with `X-Correlation-Id`, duration logging, credential sanitization.
- **Health Check**: Canonical `GET /health` endpoint with explicit separation of application health from database connectivity.
- **Database Integration Direction**: Prisma client wrapper with connection lifecycle hooks.

---

### 2.2 Future Architecture (Target Long-Term Roadmap)

The following components represent the target future architecture and are **NOT** part of the current Phase 00 deployment:

```text
[FUTURE] Client Web/Mobile Apps
       ↓
[FUTURE] Reverse Proxy / API Gateway (TLS Termination, Rate Limiting)
       ↓
Backend Modular Monolith (NestJS)
  ├── [FUTURE] Domain Modules:
  │     [Auth] [Users] [Candidates] [Companies] [Jobs] [Matching]
  │     [Applications] [ATS] [Interviews] [Offers] [Messaging]
  │     [Notifications] [Referrals] [Billing] [Moderation] [Analytics]
  ├── [FUTURE] Infrastructure Adapters:
  │     [Redis Cache] [BullMQ Queues] [OpenSearch] [Object Storage] [Email]
       ↓
[FUTURE] Full PostgreSQL Relational Domain Schema
```

**Explicitly Deferred to Future Phases:**
- Reverse proxy / API gateway setup
- Distributed caching (Redis)
- Job queues (BullMQ)
- Full-text search (OpenSearch)
- Cloud Object Storage (S3)
- Third-party email/SMS and payment providers
- All business domain logic and domain database tables

---

## 3. Modular Monolith Principles & Module Boundaries

### 3.1 Encapsulation and High Cohesion
When domain modules are introduced in future phases, each business capability will reside in its own encapsulated module:
- `*.controller.ts`: Handles incoming HTTP REST requests and invokes application services.
- `*.service.ts`: Implements business workflows and coordinates data access.
- `dto/`: Input and output Data Transfer Objects with validation annotations.
- `*.module.ts`: Declares providers and explicitly exports services for external consumption.

### 3.2 Inter-Module Dependency Rules
1. **Explicit Public Interface**: A module may consume another module only via its exported public services.
2. **No Direct Model Manipulation**: A module must never query or modify database models owned by another domain module directly.
3. **Reference by ID**: Cross-domain relationships use UUID identifiers rather than tight in-memory object graph dependencies.
4. **Asynchronous Events**: Cross-domain side-effects will be triggered via event publishing rather than direct synchronous coupling.

### 3.3 Future Extraction Readiness
Because modules maintain strict encapsulation and communicate solely through explicit contracts, any module can be extracted into an independent microservice if scale or operational requirements genuinely justify it in the future.

---

## 4. Current Cross-Cutting Foundations Detail

### 4.1 Configuration Management
- Environment variables are validated on startup via `class-validator`.
- Prevents silent runtime failures by failing fast during bootstrap if configurations are missing or invalid.
- Enforces that `CORS_ORIGIN` cannot be wildcard `'*'` in production.

### 4.2 Error Handling & Security
- `HttpExceptionFilter`: Formats standard HTTP exceptions into uniform JSON payloads with status code, machine-readable error code, message, path, timestamp, and correlation ID.
- `AllExceptionsFilter`: Catches unhandled errors. In production, masks internal stack traces, system errors, and database details to prevent information leakage.

### 4.3 Request Correlation and Structured Logging
- Every inbound request is assigned a unique `X-Correlation-Id` header (honored from caller or generated via UUIDv4).
- The correlation ID is logged alongside HTTP method, path, status, and duration, and returned in the HTTP response headers and error payloads.
- Sensitive fields (passwords, tokens, cookies, secrets) are redacted from logs.
- Note: This provides request correlation and structured logging; it is not a distributed tracing system.

### 4.4 Health Checking
- Canonical `GET /health` endpoint.
- Decouples application liveness (is the Node process active and serving requests) from database dependency connectivity (is PostgreSQL reachable).
- PostgreSQL is only reported as `connected` if an active ping succeeds.

### 4.5 Database Integration Direction
- Prisma ORM is established as the data access and migration engine.
- Connection lifecycle hooks (`onModuleInit` and `onModuleDestroy`) ensure orderly connection pool creation and graceful shutdown.
