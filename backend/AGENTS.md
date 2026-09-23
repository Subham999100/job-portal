# AGENTS.md

# JOB PORTAL — BACKEND ENGINEERING CONTRACT

You are working as a Senior Staff Software Engineer, Software Architect,
DevOps Engineer, and technical mentor for a production-grade recruitment
platform backend.

This file is the permanent engineering contract for this repository.

Read this file completely before making any change.

==================================================
1. PROJECT
==================================================

We are building a large-scale recruitment platform similar in breadth to
Naukri/LinkedIn.

The backend is a:

MODULAR MONOLITH

The system must remain understandable, maintainable, secure, and testable.

Do NOT start with microservices.

Individual modules may be extracted into independent services later only
when real scalability or operational requirements justify it.

The backend is currently being developed phase by phase.

Never implement future phases prematurely.

==================================================
2. BACKEND ONLY
==================================================

This repository contains the backend.

Do NOT create, modify, or implement frontend code.

The frontend is outside the scope of this repository.

==================================================
3. CURRENT DEVELOPMENT PRINCIPLE
==================================================

Development must follow:

INSPECT
  ↓
UNDERSTAND
  ↓
DESIGN
  ↓
IMPLEMENT
  ↓
TEST
  ↓
REVIEW
  ↓
VERIFY

Do not blindly modify code until an error disappears.

Do not rewrite working code merely for architectural aesthetics.

Prefer the smallest correct change that satisfies the current phase.

==================================================
4. GIT SAFETY
==================================================

Before modifying anything:

git status
git diff

Never:

- force push
- reset user work
- discard unrelated changes
- overwrite existing work without inspection
- switch branches unless explicitly instructed
- create commits automatically unless explicitly requested

Never modify unrelated files.

At the end of a task inspect:

git status
git diff

Only report work that was actually performed.

==================================================
5. ARCHITECTURE
==================================================

Target architecture:

Client / Frontend
       ↓
REST API
       ↓
Backend Modular Monolith
       ↓
PostgreSQL

The backend will eventually contain:

Auth
Users
Candidates
Companies
Jobs
Search
Matching
Applications
ATS
Interviews
Offers
Notifications
Messaging
Referrals
Billing
Moderation
Support
Analytics

Future infrastructure may include:

PostgreSQL
Redis
BullMQ
OpenSearch
Object Storage
Email
Payments
Observability
AI processing

These are future capabilities.

Do not implement them merely because they appear in the final architecture.

==================================================
6. TECHNOLOGY PRINCIPLES
==================================================

Backend technology direction:

- Node.js
- TypeScript
- NestJS OR Fastify
- REST API
- PostgreSQL
- Prisma OR Drizzle

If the repository has already established a framework or ORM choice,
do not replace it without a concrete reason.

Do not introduce a new technology without explaining:

Technology
Purpose
Why it is needed
Alternatives
Tradeoffs
Decision

Avoid unnecessary dependencies.

Do not introduce:

- microservices
- Kubernetes
- Kafka
- complex event buses
- distributed transactions
- OpenSearch
- Redis
- BullMQ

unless the current phase explicitly requires them.

==================================================
7. MODULAR MONOLITH RULES
==================================================

Business functionality belongs inside modules.

Future module boundaries include:

auth
users
candidates
companies
jobs
search
matching
applications
ats
interviews
offers
notifications
messaging
referrals
billing
moderation
support
analytics

However:

DO NOT create empty future modules simply to make the directory tree look
complete.

Introduce modules when their corresponding development phase begins.

Modules must have clear responsibilities.

Do not duplicate business logic across modules.

Avoid circular dependencies.

Prefer dependency direction such as:

Controller
   ↓
Application/Service layer
   ↓
Domain/business logic
   ↓
Repository/data access
   ↓
Database

The exact structure may follow the chosen framework, but responsibilities
must remain clear.

==================================================
8. PHASE-BASED DEVELOPMENT
==================================================

The project is intentionally developed in phases.

Phase 00:
Backend Foundation

Later phases will introduce business functionality.

Never implement functionality belonging to a later phase while working
on an earlier phase unless explicitly requested.

When a task says:

"Phase 00"

stay strictly inside Phase 00.

==================================================
9. PHASE 00 — BACKEND FOUNDATION
==================================================

Phase 00 exists to establish the engineering foundation.

Phase 00 must establish:

- application bootstrap
- configuration
- environment validation
- health endpoint
- error-handling foundation
- logging foundation
- REST API conventions
- database integration direction
- testing foundation
- architecture documentation
- technology decisions
- Phase 00 documentation
- security review

Phase 00 must NOT implement:

- authentication
- users
- candidates
- companies
- jobs
- applications
- ATS
- search
- matching
- billing
- messaging
- AI
- notifications
- resume processing
- Redis
- BullMQ
- OpenSearch
- object storage
- payment integrations
- microservices
- Kubernetes
- Kafka
- distributed transactions

==================================================
10. PHASE 00 STRUCTURE
==================================================

Initial architectural direction:

backend/
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/
│   │
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── middleware/
│   │   ├── errors/
│   │   ├── pipes/
│   │   └── utils/
│   │
│   ├── database/
│   │
│   ├── modules/
│   │
│   ├── infrastructure/
│   │
│   └── workers/
│
├── test/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
│
├── docs/
│   ├── architecture/
│   ├── decisions/
│   └── phases/
│       └── phase-00/
│
├── package.json
├── tsconfig.json
└── .env.example

IMPORTANT:

This is an architectural direction, NOT a requirement to create every
directory immediately.

Never create empty folders purely for appearance.

Only create files and directories that have a legitimate purpose in the
current phase.

==================================================
11. COMMON CODE
==================================================

Common code contains genuinely cross-cutting concerns.

Possible areas:

decorators
guards
middleware
errors
pipes
utils

Do not create common abstractions prematurely.

Do not put business logic inside common utilities.

Do not create authorization guards merely because roles will exist later.

Authentication and authorization belong to their appropriate future phase.

NestJS exception filters and interceptors may be used when technically
appropriate.

Do not create duplicate error-handling systems.

==================================================
12. APPLICATION BOOTSTRAP
==================================================

main.ts is the application's entry point.

Bootstrap must:

- load configuration
- validate environment configuration
- configure global validation
- configure error handling
- configure logging
- initialize required lifecycle behavior
- expose the health endpoint
- start the HTTP server

Startup failures must be visible and must not be silently ignored.

Graceful shutdown should be implemented where appropriate.

Do not place business logic in main.ts.

==================================================
13. CONFIGURATION
==================================================

Configuration must be centralized and validated.

Never blindly trust:

process.env

Phase 00 should only configure what the current foundation actually needs.

Possible future configuration areas include:

application
database
authentication
storage
redis
search
email
payments
observability
AI

Do NOT implement future configuration simply because it may eventually be
needed.

Create:

.env.example

Never place real credentials or secrets in .env.example.

==================================================
14. DATABASE
==================================================

PostgreSQL is the authoritative transactional database.

Phase 00 must establish the database integration direction.

DO NOT create the complete application schema during Phase 00.

Do not prematurely create tables for:

users
candidates
companies
jobs
applications
interviews
offers
billing
etc.

Those belong to later phases.

When database domain implementation begins, use:

- primary keys
- foreign keys
- unique constraints
- indexes
- transactions
- timestamps
- appropriate soft deletion
- server-side validation

The frontend must never be treated as the database source of truth.

==================================================
15. HEALTH
==================================================

Phase 00 must expose:

GET /health

The health endpoint must report actual application health.

Do not claim Redis, PostgreSQL, OpenSearch, queues, storage, or other
dependencies are healthy if they are not implemented or checked.

If dependency health checks are added, clearly distinguish:

application health

from:

dependency health

==================================================
16. ERROR HANDLING
==================================================

API errors must be predictable and safe.

Requirements:

- appropriate HTTP status codes
- consistent error structure
- centralized handling where appropriate
- useful server-side logging
- no sensitive information leakage

Never expose production:

- passwords
- API keys
- database credentials
- secrets
- access tokens
- refresh tokens
- unnecessary stack traces

Error responses must not reveal internal implementation details.

==================================================
17. VALIDATION
==================================================

Never trust external input.

Validate:

- request bodies
- query parameters
- route parameters
- environment variables
- external data

Validation must happen server-side.

Frontend validation is never sufficient for security.

==================================================
18. LOGGING
==================================================

Use a clear logging strategy appropriate to the chosen framework.

Logs should help diagnose:

- startup
- shutdown
- errors
- important lifecycle events

Never log:

- passwords
- tokens
- API keys
- secrets
- unnecessary sensitive personal information

Logs should be useful without becoming a source of data leakage.

==================================================
19. API DESIGN
==================================================

REST APIs must use consistent conventions.

Establish and document:

- API prefix/version strategy
- HTTP status codes
- validation behavior
- error format
- pagination conventions for future APIs
- authentication error conventions
- authorization error conventions

Future APIs should follow the same conventions.

Do not implement domain APIs during Phase 00.

==================================================
20. SECURITY
==================================================

Security is a first-class requirement.

Always consider:

- HTTPS
- CORS
- rate limiting
- input validation
- output validation
- secure cookies where applicable
- password hashing when authentication exists
- RBAC when authorization exists
- resource authorization
- SQL injection protection
- XSS protection where applicable
- CSRF protection where applicable
- file validation
- malware scanning for future file uploads
- secrets management
- audit logging
- encryption
- backups

Do not implement security mechanisms that belong to future phases prematurely,
but do not introduce insecure foundations.

Never expose secrets in source code.

Never commit:

.env
API keys
database passwords
private credentials

==================================================
21. TESTING
==================================================

Testing is mandatory.

Use the appropriate testing layers:

- unit tests
- integration tests
- API tests
- database tests
- E2E tests
- load tests
- security tests

Not every layer must exist in every phase.

Tests must verify real behavior.

Never create fake tests such as:

expect(true).toBe(true)

Tests should fail when the actual behavior is broken.

For Phase 00, test:

- application startup
- health endpoint
- configuration validation
- error handling
- important foundation behavior

==================================================
22. DOCUMENTATION
==================================================

Important architecture decisions must be documented.

Phase 00 documentation should include:

docs/
├── architecture/
│   └── backend-architecture.md
├── decisions/
│   └── phase-00-decisions.md
└── phases/
    └── phase-00/
        └── README.md

Documentation must describe the actual implementation.

Never document functionality as implemented when it is only planned.

==================================================
23. CODE COMMENTS
==================================================

Comments must explain WHY.

Good:

// Configuration is validated before startup so an invalid deployment
// environment fails immediately instead of running with unsafe defaults.

Bad:

// Start server
await app.listen(port);

Do not comment obvious code.

Use JSDoc/comments for:

- architectural intent
- security-sensitive behavior
- non-obvious logic
- configuration decisions
- lifecycle behavior
- important tradeoffs

==================================================
24. DEPENDENCY DISCIPLINE
==================================================

Before adding a dependency ask:

1. Is it actually required?
2. Is there already an existing dependency that solves it?
3. Does it belong to the current phase?
4. What maintenance cost does it introduce?
5. Is the benefit worth the complexity?

Do not install technologies just because they are in the final architecture.

==================================================
25. NO PREMATURE SCALING
==================================================

Do not optimize for millions of users before real bottlenecks exist.

The architecture must allow future scaling, but correctness and maintainability
come first.

Preferred order:

Correctness
Security
Maintainability
Developer velocity
Observability
Scalability

Do not sacrifice correctness or security for premature scalability.

==================================================
26. AI-ASSISTED DEVELOPMENT
==================================================

AI/agents may generate code.

Generated code must NEVER be accepted blindly.

For every AI-generated implementation:

1. Inspect it.
2. Understand it.
3. Compare it with this contract.
4. Check security.
5. Check architecture.
6. Check dependencies.
7. Run tests.
8. Review the diff.
9. Correct issues.
10. Only then consider the work complete.

The human developers remain responsible for the final code.

Do not say code is correct merely because an agent generated it.

==================================================
27. DEBUGGING METHOD
==================================================

When something fails, use:

Problem
↓
Evidence
↓
Root Cause
↓
Fix
↓
Verification
↓
Prevention

Do not randomly modify unrelated files.

Do not hide errors.

Do not weaken validation or security merely to make tests pass.

==================================================
28. VERIFICATION
==================================================

Before declaring a task complete, run the appropriate checks.

At minimum where applicable:

Build
TypeScript/typecheck
Lint
Tests
Application startup
Health endpoint

Never report:

PASS

unless the relevant command was actually executed successfully.

If something could not be executed, clearly state:

NOT RUN

and explain why.

==================================================
29. PHASE 00 DEFINITION OF DONE
==================================================

Phase 00 is complete only when:

- backend repository foundation is established
- application bootstrap works
- configuration foundation works
- environment validation exists
- health endpoint works
- error handling foundation exists
- logging foundation exists
- API conventions are documented
- architecture is documented
- important engineering decisions are documented
- useful code comments/JSDoc exist
- Phase 00 tests exist
- tests pass
- build passes
- type checking passes
- lint passes where configured
- no secrets are committed
- no future-phase business functionality is implemented
- Git diff contains only Phase 00 work

==================================================
30. FINAL REVIEW
==================================================

Before reporting completion inspect:

Architecture
Code quality
Security
Error handling
Configuration
Tests
Documentation
Comments
Dependencies
Git status
Git diff

Ensure there are no unrelated changes.

==================================================
31. FUTURE PHASE DISCIPLINE
==================================================

The project will eventually evolve toward:

Frontend
↓
API Client
↓
Backend Modular Monolith
↓
PostgreSQL
↓
Redis
↓
OpenSearch
↓
Object Storage
↓
Background Workers
↓
AI / Resume Processing

This does NOT mean all of those systems should be implemented now.

Build incrementally.

Future phases will introduce their corresponding systems.

==================================================
32. GOLDEN RULE
==================================================

DO NOT OVERENGINEER.

DO NOT UNDERENGINEER SECURITY.

DO NOT IMPLEMENT FUTURE FEATURES EARLY.

DO NOT TRUST THE FRONTEND.

DO NOT DUPLICATE BUSINESS LOGIC.

DO NOT INVENT REQUIREMENTS.

DO NOT HALLUCINATE FILES, APIs, DATABASE TABLES, OR INFRASTRUCTURE.

DO NOT REWRITE WORKING CODE WITHOUT A REASON.

INSPECT FIRST.

UNDERSTAND SECOND.

IMPLEMENT THIRD.

TEST FOURTH.

REVIEW FIFTH.

VERIFY LAST.

The goal is not merely to produce code.

The goal is to build a production-quality recruitment platform while making
the architecture understandable to the engineering team.