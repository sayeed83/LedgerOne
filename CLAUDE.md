# CLAUDE.md — LedgerOne AI Operating Manual

This file is the quick-reference operating manual for any AI coding assistant (Claude, Cursor, GitHub Copilot, etc.) working in this repository. It does not replace the Engineering Handbook — it tells you which handbook chapter governs a decision so you look it up instead of guessing.

**The Engineering Handbook (root-level `NN_*.md` files) is the only source of truth. This file is a map to it, not a substitute for it.**

---

## 1. Project Overview

LedgerOne is a **Cloud Native ERP SaaS**. Full product vision, SaaS hierarchy, and module list: `01_PROJECT_CONTEXT.md`. Business rules (accounting, tax, workflow logic): `00_BUSINESS_RULES.md`. When a business rule isn't documented, **ask — do not assume.**

## 2. Repository Structure

```
ledgerone/
├── apps/
│   ├── api/            Backend — Express.js
│   └── web/             Frontend — Next.js
├── packages/
│   ├── shared-types/    DTOs/contracts shared between apps/api and apps/web
│   ├── shared-utils/    Framework-agnostic shared utilities
│   └── ui/              Shared design-system primitives
├── docker/               Container build/orchestration
├── scripts/              Repo tooling (setup, db, lint, scaffold)
├── engineering/          Process docs — ADRs, checklists, prompts, reviews (not app code)
└── tsconfig.base.json
```

Authoritative tree and naming rules: `04_FOLDER_STRUCTURE.md`. Generated snapshot: `PROJECT_DIRECTORY.md`. Never invent a folder that contradicts Ch.2–3 of `04_FOLDER_STRUCTURE.md`.

## 3. Technology Stack

Frozen — do not add, remove, or substitute packages. Full list with versions/rationale: `02_TECH_STACK.md`.

| Layer | Stack |
|---|---|
| Package manager | npm Workspaces |
| Backend | Node.js 22 LTS, Express.js, TypeScript, Prisma ORM |
| Validation / Auth | Zod · JWT + Refresh Token · Passport.js · Argon2 · RBAC |
| Data / Cache / Queue | MySQL 8 · Redis · BullMQ |
| Logging / Monitoring | Pino · CloudWatch · Health Checks |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, TanStack Query, TanStack Table, React Hook Form |
| Storage / Email | AWS S3 · AWS SES |
| Deployment | Docker · AWS ECS · AWS RDS · CloudFront · ALB |

## 4. Architecture Principles

- **Modular Monolith** — one deployable backend, hard module boundaries, no microservices split without an ADR.
- **Clean Architecture** — Presentation → Business → Domain → Repository layering per module (`03_ARCHITECTURE.md` Ch.5).
- **Practical Domain-Driven Design** — Aggregates, Value Objects, domain-owned repository interfaces.
- **Feature-First Architecture** — folders mirror business features, not technical layers (`04_FOLDER_STRUCTURE.md` Ch.1.4).

Full rationale, diagrams, and layer rules: `03_ARCHITECTURE.md`. Never propose an architecture change inline — record it as an ADR first (`engineering/architecture-decisions/`).

## 5. Development Rules

- Work **milestone by milestone** — check `engineering/implementation/current-phase.md` before starting anything.
- One PR-sized change at a time; no speculative scaffolding for future phases.
- If a chapter conflicts with what you're about to write, the handbook wins — stop and flag the conflict.
- Full standard: `05_CODING_STANDARDS.md`.

## 6. Coding Rules

- TypeScript strict mode; no `any` without a documented reason.
- Naming (`04_FOLDER_STRUCTURE.md` Ch.3.3):

| Item | Convention | Example |
|---|---|---|
| Folder | `kebab-case` | `journal-entries/` |
| Class file | `kebab-case.role.ts` | `journal-entry.controller.ts` |
| Class name | `PascalCase` | `JournalEntryController` |
| Interface (domain-owned) | `I` + `PascalCase` | `IJournalEntryRepository` |
| Variable / function | `camelCase` | `postJournalEntry` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_JOURNAL_ENTRY_LINES` |
| React component | `PascalCase.tsx` | `JournalEntryTable.tsx` |
| React hook | `useCamelCase.ts` | `useJournalEntries.ts` |
| Test file | `<name>.spec.ts` / `.test.tsx` | `journal-entry.service.spec.ts` |

- File-role suffixes are load-bearing (drive lint/layer-boundary tooling) — never mix roles in one file: `.controller.ts`, `.dto.ts`, `.middleware.ts`, `.service.ts`, `.aggregate.ts`, `.value-object.ts`, `.repository.ts`, `.manifest.ts`, `.event.ts`, `.job.ts`.
- Full standard: `05_CODING_STANDARDS.md`.

## 7. API Rules

- REST, versioned under `/api/v1`.
- OpenAPI/Swagger documented for every endpoint.
- DTO in/out on every controller boundary — never leak a Prisma model or domain Aggregate across the wire.
- Full standard: `07_REST_API_STANDARDS.md`.

## 8. Database Rules

- MySQL 8 via Prisma only — no raw SQL bypassing Prisma except where the handbook explicitly permits it.
- Standard columns, naming, and timestamp/timezone rules: `06_DATABASE_STANDARDS.md` Ch.2.
- Every schema change needs a Prisma migration — never hand-edit the database.
- Full standard: `06_DATABASE_STANDARDS.md`.

## 9. Frontend Rules

- Next.js App Router, feature-first folder layout (`08_FRONTEND_STANDARDS.md` Ch.4).
- Server state via TanStack Query, forms via React Hook Form + Zod resolvers — no ad hoc `useEffect` data fetching.
- Full standard: `08_FRONTEND_STANDARDS.md`.

## 10. Security Rules

- Auth: JWT + refresh token via Passport.js, passwords hashed with Argon2.
- Authorization: RBAC + permission engine — every endpoint declares required permissions explicitly.
- Multi-tenant isolation is enforced at the middleware layer on every request — never trust a client-supplied tenant ID alone.
- Full standard: `09_SECURITY_GUIDELINES.md`.

## 11. Module Development Workflow

1. Check `engineering/implementation/current-phase.md` and the matching folder in `engineering/prompts/`.
2. Check `engineering/architecture-decisions/` for an existing ADR before introducing a new pattern, dependency, or cross-module contract.
3. Scaffold using the module template (`12_MODULE_TEMPLATE.md`, `engineering/templates/module.md`).
4. Follow the module lifecycle in `12_MODULE_DEVELOPMENT_GUIDE.md`.
5. When a prompt is executed and superseded, move it to `engineering/prompts/archive/` — do not delete it.

## 12. Git Workflow

- Trunk-based development: `main` is the only long-lived branch, always releasable.
- Branch naming: `type/short-description` (e.g. `feat/journal-entry-reversal`).
- Every branch traces to a GitHub Issue (or a PR description standing in for trivial changes).
- No direct commits to `main`; no force-push or history rewrite on `main`.
- Conventional Commits for messages; PR required for every merge.
- Full standard: `11_GIT_WORKFLOW.md`.

## 13. AI Development Rules

- Never redesign the architecture, change the technology stack, or contradict the Engineering Handbook.
- Never generate code that violates coding, API, database, frontend, or security standards above.
- Never assume a business rule not documented in `00_BUSINESS_RULES.md` — ask instead.
- Ask for clarification if handbook documentation is insufficient for the task at hand.
- Generate production-ready code only — no placeholders, no `TODO: implement later`.
- Work milestone by milestone; do not scaffold future phases speculatively.
- Prefer consistency with existing patterns over cleverness or novel abstractions.

## 14. Do Not Do

- Do not introduce a new package, framework, or service outside Section 3 without an approved ADR.
- Do not bypass Prisma with raw SQL, skip DTOs, or leak domain/Prisma models across API boundaries.
- Do not commit directly to `main` or force-push.
- Do not fabricate business rules, API contracts, or schema fields not present in the handbook.
- Do not create microservices, a second long-lived branch, or a parallel "temporary" architecture.
- Do not duplicate handbook content into this file, code comments, or new docs — link to the chapter instead.
- Do not leave commented-out code, unused imports, or dead scaffolding in a commit.

## 15. Before Writing Code Checklist

- [ ] Read `engineering/implementation/current-phase.md` — is this the active phase/module?
- [ ] Identify the relevant handbook chapter(s) for this change (Sections 6–10 above point to them).
- [ ] Check `engineering/architecture-decisions/` for an existing ADR on this pattern.
- [ ] Confirm the business rule exists in `00_BUSINESS_RULES.md` if this touches accounting/tax/workflow logic.
- [ ] Confirm naming and folder placement against `04_FOLDER_STRUCTURE.md`.

## 16. Before Commit Checklist

- [ ] Lint, typecheck, and tests pass locally.
- [ ] No dead code, no stray `console.log`/`any`, no commented-out blocks.
- [ ] DTOs, migrations, and OpenAPI docs updated if the contract changed.
- [ ] Commit message follows Conventional Commits (`11_GIT_WORKFLOW.md` Ch.6–7).
- [ ] Relevant `engineering/checklists/*.md` file reviewed (api, backend, frontend, database, security, release).

## 17. Definition of Done

- Code merged to `main` via reviewed PR, passing CI.
- Tests written per `17_TESTING_STRATEGY.md` and passing.
- API changes documented in OpenAPI/Swagger.
- DB changes shipped as a Prisma migration.
- No open handbook violations; any accepted exception is documented as an ADR.
- `engineering/implementation/current-phase.md` updated if phase status changed.

## 18. Common Commands

```bash
npm install                 # install all workspace dependencies
npm run dev -w apps/api     # run backend in dev mode
npm run dev -w apps/web     # run frontend in dev mode
npm run test -w apps/api    # backend tests
npm run lint                # lint all workspaces
npx prisma migrate dev      # create/apply a database migration (run from apps/api)
```

Workspace-specific scripts are defined in each app/package's own `package.json` as they are introduced — check there before assuming a command exists.

## 19. Repository Conventions

- Monorepo, npm Workspaces: `apps/*`, `packages/*`.
- Package names: `@ledgerone/{name}` (e.g. `@ledgerone/shared-types`).
- Numbered handbook files (`00_`–`17_`) indicate reading sequence, not priority.
- `engineering/` is documentation and process only — no application source code belongs there.

## 20. Module Naming Conventions

- Module folder: `kebab-case`, singular business concept (e.g. `journal-entries`, `invoices`).
- Each module owns its own `presentation/`, `business/`, `domain/`, `repository/` layers (`03_ARCHITECTURE.md` Ch.5).
- Every module declares a `module.manifest.ts` describing its public contract.

## 21. Folder Naming Conventions

- All folders: `kebab-case`.
- Workspace app folders: short, `kebab-case` (`api`, `web`).
- Workspace package folders: descriptive `kebab-case` (`shared-types`, `shared-utils`, `ui`).
- Full rules: `04_FOLDER_STRUCTURE.md` Ch.2.5, Ch.3.

## 22. Error Handling Principles

- Fail loudly, not silently (`05_CODING_STANDARDS.md` Ch.2.9) — no swallowed exceptions or empty catch blocks.
- Domain/business errors are typed and distinguishable from infrastructure errors.
- Controllers translate errors to correct HTTP status codes; never leak stack traces to API responses.

## 23. Logging Principles

- Pino for all structured logging — no `console.log` in application code.
- Log at module/request boundaries with correlation/request IDs for traceability.
- Never log secrets, tokens, passwords, or full PII payloads.

## 24. Testing Expectations

- Jest + Supertest for backend; tests colocated with the file under test as `.spec.ts`/`.test.tsx`.
- New business logic requires unit tests; new endpoints require integration tests.
- Full strategy: `17_TESTING_STRATEGY.md`.

## 25. Documentation Expectations

- Handbook chapters are updated when a decision changes, not left to drift from the code.
- New architectural decisions are recorded as ADRs (`engineering/architecture-decisions/`) before implementation.
- Don't duplicate handbook content elsewhere — link to the chapter.

## 26. Review Checklist

Use the matching checklist in `engineering/checklists/` before merging:
- `backend.md`, `frontend.md`, `api.md`, `database.md`, `security.md`, `release.md`.

Record findings after review under `engineering/reviews/` using `engineering/templates/review.md`.

## 27. AI Assistant Instructions

When working in this repository, an AI assistant must:

1. Read Section 11 (Module Development Workflow) before starting implementation work.
2. Resolve every design question by chapter lookup, not invention — cite the chapter in your response.
3. Stop and ask if the handbook is silent, ambiguous, or contradicts the request.
4. Never contradict `00_BUSINESS_RULES.md`, `02_TECH_STACK.md`, or `03_ARCHITECTURE.md` under any circumstance.
5. Treat this file as a router to the handbook — when in doubt, the numbered handbook file is correct and this file is wrong.
