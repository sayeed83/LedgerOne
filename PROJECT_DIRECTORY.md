# LedgerOne — Project Directory Reference

This file is a generated snapshot of the physical repository skeleton, produced strictly from the frozen `04_FOLDER_STRUCTURE.md` handbook. It contains no business logic, no configuration values, and no code — every file below is an empty placeholder. Its only purpose is to give a fast, at-a-glance map of where things live; the handbook chapters cited alongside each section remain the actual source of truth.

**Revision note:** This snapshot incorporates the approved findings of the Chief-Architect review (see `docs/adr/` once filed) that closed three compliance gaps against already-frozen documents — a separate worker process entrypoint (`10_DEPLOYMENT_ARCHITECTURE.md` CONT-002), a per-module Business Rules reference file (`12_MODULE_DEVELOPMENT_GUIDE.md` MOD-048), and a filesystem home for infrastructure/external-service adapters (`03_ARCHITECTURE.md` Ch.15–16) — plus additive tooling (module registry, scaffolding script, Prisma schema composer) the frozen docs already called for but that had no physical file yet. A subsequent final validation pass additionally corrected a systemic parity gap: database schema/migrations, integration tests, e2e tests, shared-type contracts, and the frontend module/service/locale trees had been populated for the eight Business Capability modules only — the five Foundation/Platform modules (`authentication`, `authorization`, `organization`, `notification`, `audit`) were silently absent from all of them, contradicting `03_ARCHITECTURE.md` Ch.6.8.2's "Foundation/Platform modules are modules, not exceptions." This is now corrected — all thirteen modules have identical fan-out everywhere. No architecture, technology, or approved folder was changed or removed.

---

## Full Tree

```
ledgerone/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-production.yml
│   │   └── deploy-staging.yml
│   └── CODEOWNERS
├── apps/
│   ├── api/
│   │   ├── config/
│   │   │   ├── app.config.ts
│   │   │   ├── database.config.ts
│   │   │   ├── redis.config.ts
│   │   │   └── storage.config.ts
│   │   ├── src/
│   │   │   ├── common/
│   │   │   │   ├── constants/
│   │   │   │   ├── infrastructure/                ← NEW (review Finding 3.1/9) — external-service adapters
│   │   │   │   │   ├── documents/                 (PDFKit, ExcelJS generators)
│   │   │   │   │   ├── email/                      (AWS SES client — called only by shared/notification/)
│   │   │   │   │   ├── payments/                   (Payment Gateway adapters — called only by owning module's Repository/Business layer)
│   │   │   │   │   ├── queue/                       (shared BullMQ connection/queue-registry setup)
│   │   │   │   │   └── storage/                     (AWS S3 client + pre-signed URL helper)
│   │   │   │   ├── logging/
│   │   │   │   │   ├── correlation-context.ts
│   │   │   │   │   └── logger.config.ts
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── correlation-id.middleware.ts
│   │   │   │   │   ├── current-tenant.middleware.ts
│   │   │   │   │   ├── error-handler.middleware.ts
│   │   │   │   │   ├── jwt-auth.middleware.ts
│   │   │   │   │   ├── logging.middleware.ts
│   │   │   │   │   └── permission.middleware.ts
│   │   │   │   ├── types/
│   │   │   │   ├── utils/
│   │   │   │   └── validators/
│   │   │   │       └── request.validator.ts
│   │   │   ├── database/
│   │   │   │   ├── migrations/                  ← one folder per module, Business AND Foundation alike (Ch.6.8.2: "Foundation modules are modules, not exceptions")
│   │   │   │   │   ├── accounting/
│   │   │   │   │   ├── audit/
│   │   │   │   │   ├── authentication/            ← owns the Users table — corrected in final validation, was missing
│   │   │   │   │   ├── authorization/             (owns Roles/Permissions tables)
│   │   │   │   │   ├── banking/
│   │   │   │   │   ├── crm/
│   │   │   │   │   ├── inventory/
│   │   │   │   │   ├── notification/
│   │   │   │   │   ├── organization/              (owns Tenants/Organizations tables)
│   │   │   │   │   ├── payroll/
│   │   │   │   │   ├── purchase/
│   │   │   │   │   ├── reporting/
│   │   │   │   │   └── sales/
│   │   │   │   ├── schema/                       ← one {module}.prisma per module, same Business/Foundation parity
│   │   │   │   │   ├── accounting.prisma
│   │   │   │   │   ├── audit.prisma
│   │   │   │   │   ├── authentication.prisma
│   │   │   │   │   ├── authorization.prisma
│   │   │   │   │   ├── banking.prisma
│   │   │   │   │   ├── base.prisma
│   │   │   │   │   ├── crm.prisma
│   │   │   │   │   ├── inventory.prisma
│   │   │   │   │   ├── notification.prisma
│   │   │   │   │   ├── organization.prisma
│   │   │   │   │   ├── payroll.prisma
│   │   │   │   │   ├── purchase.prisma
│   │   │   │   │   ├── reporting.prisma
│   │   │   │   │   └── sales.prisma
│   │   │   │   └── seeds/
│   │   │   │       ├── development/
│   │   │   │       └── platform/
│   │   │   ├── modules/                     ← Business Capability modules (Ch.5, Ch.6)
│   │   │   │   ├── accounting/
│   │   │   │   ├── banking/
│   │   │   │   ├── crm/
│   │   │   │   ├── inventory/
│   │   │   │   ├── payroll/
│   │   │   │   ├── purchase/
│   │   │   │   ├── reporting/
│   │   │   │   └── sales/
│   │   │   │       (each module identical — see "Canonical Module Shape" below)
│   │   │   ├── shared/                      ← Foundation/Platform modules (Ch.5.4)
│   │   │   │   ├── audit/
│   │   │   │   ├── authentication/
│   │   │   │   ├── authorization/
│   │   │   │   ├── notification/
│   │   │   │   └── organization/
│   │   │   │       (each identical to a business module's shape)
│   │   │   ├── module-registry.ts           ← NEW (review Finding 1.1) — aggregates every module.manifest.ts
│   │   │   ├── server.ts                     (HTTP entrypoint — request-handling `api` service)
│   │   │   └── worker.ts                     ← NEW (review Finding 5.1) — BullMQ consumer entrypoint, no HTTP listener; deploys as the separate `worker` ECS service per 10_DEPLOYMENT_ARCHITECTURE.md CONT-002
│   │   ├── test/
│   │   │   └── integration/
│   │   │       ├── accounting/ … sales/, authentication/ … audit/     (one folder per module — all thirteen, Ch.16)
│   │   └── .env.example
│   └── web/
│       ├── public/
│       │   ├── fonts/
│       │   ├── icons/
│       │   └── images/
│       └── src/
│           ├── app/                         ← Next.js routing only, thin shims (Ch.12.4)
│           │   ├── (dashboard)/
│           │   │   ├── accounting/ … sales/, authentication/ … audit/     (all thirteen — corrected in final validation, Foundation modules were missing)
│           │   └── layout.tsx
│           ├── components/
│           │   ├── data/                    (data-dense: tables, virtualized lists)
│           │   └── ui/                      (primitives: Button, Input, Modal)
│           ├── hooks/
│           │   ├── use-current-tenant.ts
│           │   └── use-permissions.ts
│           ├── layouts/
│           │   ├── erp-shell.layout.tsx
│           │   └── navigation.config.ts
│           ├── locales/
│           │   ├── en/  (common.json + one {module}.json per module — all thirteen)
│           │   └── es/  (mirrors en/ exactly)
│           ├── modules/                     ← mirrors backend modules/ (Ch.12.3) — all thirteen, Business and Foundation alike
│           │   ├── accounting/ … sales/, authentication/ … audit/     (e.g. authentication/screens/ holds Login/Register/ForgotPassword)
│           │       ├── components/  (module-local only)
│           │       ├── hooks/       (module-local only)
│           │       └── screens/     (real screen implementations)
│           └── services/
│               ├── api-client.ts            (base Axios instance)
│               └── {module}.service.ts      (one per module — all thirteen)
├── docker/
│   ├── api.Dockerfile
│   ├── docker-compose.dev.yml               (MySQL, Redis, local S3-compatible storage)
│   ├── web.Dockerfile
│   └── worker.Dockerfile                    ← NEW (review Finding 5.1) — separate `worker` ECS image, per 10_DEPLOYMENT_ARCHITECTURE.md AWS-004
├── docs/
│   ├── adr/                                 (Architecture Decision Records)
│   ├── diagrams/                            (non-Mermaid diagram sources)
│   └── runbooks/                            (operational runbooks)
├── e2e/                                     ← cross-stack tests, one folder per module (Ch.16.4) — all thirteen
│   ├── accounting/ … sales/, authentication/ … audit/
├── packages/
│   ├── shared-types/
│   │   └── src/
│   │       ├── accounting/ … sales/, authentication/ … audit/     (DTO/contract shapes shared by both apps — Foundation modules included, since login/permission/tenant shapes are consumed by the frontend exactly like business DTOs)
│   ├── shared-utils/
│   │   └── src/                             (framework-agnostic helpers, e.g. money math)
│   └── ui/
│       └── src/                             (design-system primitives, if shared beyond web)
├── scripts/
│   ├── db/
│   │   ├── compose-schema.ts                ← NEW (review Finding 6.1) — concatenates per-module .prisma files into Prisma's single required schema input
│   │   ├── migrate.sh
│   │   └── seed.sh
│   ├── lint/
│   │   ├── check-layer-boundaries.ts        (enforces Ch.5.7.1)
│   │   └── check-module-imports.ts          (enforces Ch.6.7 / Ch.19.3)
│   ├── scaffold/                            ← NEW (review Finding 1.1/13.1)
│   │   └── create-module.ts                 (generates the canonical module shape byte-identically, per 12_MODULE_DEVELOPMENT_GUIDE.md's "Best Practices"/"Future Considerations")
│   └── setup/
│       └── bootstrap-dev-environment.sh
├── .env.example
├── 00_BUSINESS_RULES.md
├── 01_PROJECT_CONTEXT.md
├── 02_TECH_STACK.md
├── 03_ARCHITECTURE.md
├── 04_FOLDER_STRUCTURE.md
├── 05_CODING_STANDARDS.md
├── 06_DATABASE_STANDARDS.md
├── 07_REST_API_STANDARDS.md
├── 08_FRONTEND_STANDARDS.md
├── 09_SECURITY_GUIDELINES.md
├── 10_DEPLOYMENT_ARCHITECTURE.md
├── 11_GIT_WORKFLOW.md
├── 12_MODULE_DEVELOPMENT_GUIDE.md
├── 12_MODULE_TEMPLATE.md
├── 13_ACCOUNTING_ENGINE.md
├── 14_DATABASE_SCHEMA.md
├── 15_API_SPECIFICATION.md
├── 16_UI_SCREEN_SPECIFICATIONS.md
├── 17_TESTING_STRATEGY.md
├── package.json
└── tsconfig.base.json
```

---

## Canonical Module Shape (every entry under `modules/` and `shared/`)

Every one of the thirteen backend module folders (`accounting`, `banking`, `crm`, `inventory`, `payroll`, `purchase`, `reporting`, `sales`, `audit`, `authentication`, `authorization`, `notification`, `organization`) has the **identical** internal shape — this is Chapter 6's canonical tree, repeated verbatim per module so no folder is a special case:

```
{module}/
├── presentation/
│   ├── controllers/
│   │   └── v1/                  (URL-path API versioning, Ch.6.4 — v2/ only on an actual breaking change)
│   ├── dto/
│   │   ├── requests/
│   │   └── responses/
│   ├── middleware/               (module-local only — shared middleware lives in common/)
│   └── validators/               (module-local only)
├── business/                     (one file per use case, verb-first naming)
├── domain/
│   ├── aggregates/                (Aggregate Root + child entities, one file = one consistency boundary)
│   ├── entities/                  (simple, CRUD-classified entities — Ch.7.4)
│   ├── value-objects/
│   ├── interfaces/                (domain-owned repository interfaces)
│   └── enums/
├── repository/                   (Prisma-backed implementations of domain/interfaces)
├── events/
│   ├── published/                 (facts this module emits)
│   └── subscribers/               (reactions to other modules' facts, named on-{fact}.subscriber.ts)
├── jobs/                          (BullMQ scheduled work)
├── module.manifest.ts             (the module's declared, published contract)
├── index.ts                       (mounts this module's Express router)
├── business-rules.md              ← NEW (review Finding 2.1) — reference-only links into 00_BUSINESS_RULES.md sections this module implements; never a duplicate copy (12_MODULE_DEVELOPMENT_GUIDE.md MOD-048)
└── README.md                      (per 12_MODULE_TEMPLATE.md)
```

Why this matters: an engineer who has navigated one module can navigate all thirteen — the shape is the same whether the module owns one Aggregate or ten (Ch.6.12).

---

## Top-Level Folder Purpose Summary

| Folder | Purpose |
|---|---|
| `apps/api` | Express.js backend — Modular Monolith, Clean Architecture layers, one module per business capability |
| `apps/api/src/common/infrastructure/` | External-service adapters (S3, SES, PDFKit/ExcelJS, BullMQ connection, payment gateways) — still `common/` (shared infra, Ch.5.4), organized with the granularity those clients need. Not a sixth architectural layer; consumed from Business/Repository code exactly like Ch.4.5.2's shared Repository infrastructure |
| `apps/api/src/worker.ts` | Separate BullMQ-consumer entrypoint (no HTTP listener), deployed as its own independently-scaled `worker` service — distinct from `server.ts`'s `api` service, per `10_DEPLOYMENT_ARCHITECTURE.md` CONT-002 |
| `apps/api/src/module-registry.ts` | Aggregates every module's `module.manifest.ts` into one catalog `server.ts`/`worker.ts` mount against — the physical implementation of `03_ARCHITECTURE.md` Ch.6.7's "module registry/catalog" concept |
| `apps/web` | Next.js frontend — mirrors the backend's module list, routing kept as thin shims over module-owned screens |
| `packages/` | Code shared *between* `apps/api` and `apps/web` only — types and framework-agnostic utils, never business logic. `packages/ui` stays intentionally empty until a second frontend consumer exists (e.g., a future `apps/mobile`) — until then, all UI primitives live in `apps/web/src/components/ui/` |
| `docs/` | Operational documentation (ADRs, runbooks, diagram sources) — distinct from the numbered governance docs at repo root |
| `scripts/` | Dev/CI tooling: the two lint scripts that mechanically enforce this handbook's layer and import boundary rules, the Prisma schema composer (`scripts/db/compose-schema.ts`), and the module scaffolding script (`scripts/scaffold/create-module.ts`) that generates new modules byte-identically to the Canonical Module Shape above |
| `docker/` | Local dev environment plus one Dockerfile per deployable service — `api`, `web`, and `worker` (three separate ECS services/ECR repos, never combined, per `10_DEPLOYMENT_ARCHITECTURE.md`) |
| `.github/` | CI/CD workflows and CODEOWNERS-based module-to-team ownership mapping |
| `e2e/` | Cross-stack end-to-end tests, one folder per module — the only test tier not co-located with source |
| `01_…` – `17_…` | Frozen governance handbook — the single source of truth this entire skeleton was generated from |

---

## Governance Notes (from the Chief-Architect review)

- **No `src/integrations/` folder.** The need this would address is already covered by `common/infrastructure/` — a second top-level folder for the same category (shared infra) would fragment it with no clear rule for which goes where, and would risk becoming the kind of unowned catch-all Ch.8.9 already warns `common/` itself must avoid.
- **No `shared/platform/` module.** "Platform" is a category label, not a business capability, and fails Ch.6.3's module-ownership test the same way Ch.9.7 already rejected a generic shared "Customer" type. If/when **Settings** or **Foundation** (both named in `01_PROJECT_CONTEXT.md`/Ch.6.4) are actually built, each is evaluated individually as its own `shared/{name}` sibling.
- **`modules/` domain-grouping tier remains deferred**, per `04_FOLDER_STRUCTURE.md` Ch.1.12/Ch.21.4's own stated trigger (module count grows large enough to make flat listing unwieldy) — not applied at today's 13 modules. The grouping taxonomy and exact trigger should be recorded in `docs/adr/` ahead of time so applying it later is mechanical, not an ad hoc call made under delivery pressure.
- **`packages/api-contracts` (OpenAPI-generated shared types) is not created yet**, consistent with `04_FOLDER_STRUCTURE.md` Ch.14.13 and `07_REST_API_STANDARDS.md` VAL-005's own deferred-until-stable stance — re-evaluate as module/developer count grows, since hand-maintained `shared-types` drift risk (Ch.14.6) compounds faster at scale.
- **Vertical-specific modules** (e.g., Hospital, School, Hotel, Restaurant, Construction, Transport) are not in scope of any frozen document today. The structure would absorb them additively exactly as it does Manufacturing/POS/Assets/Projects — but only after a product-scope decision is recorded in `00_BUSINESS_RULES.md`/`01_PROJECT_CONTEXT.md`, not as a standing architectural gap.

## AI Context Quick Reference

An AI assistant (or new engineer) asking "where does this file go" is answered, in order, by:
1. **`04_FOLDER_STRUCTURE.md` Ch.19.3** — the consolidated import-legality table (what a given layer may/must never import).
2. **The Canonical Module Shape**, above — identical for all thirteen current modules and every future one.
3. **`scripts/scaffold/create-module.ts`** — once implemented, the deterministic way to produce a new module's skeleton, rather than reconstructing it from prose.

---

*Generated from `04_FOLDER_STRUCTURE.md` (frozen, v1.1). No architecture, technology, or business logic decisions are introduced by this file — it is a navigational reference only. Updated per the approved Chief-Architect review findings; no approved folder was removed or renamed.*
