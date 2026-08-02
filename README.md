# LedgerOne

Cloud Native ERP SaaS.

## Documentation

All engineering decisions are governed by the frozen handbook in the repository root:

- `00_BUSINESS_RULES.md`
- `01_PROJECT_CONTEXT.md`
- `02_TECH_STACK.md`
- `03_ARCHITECTURE.md`
- `04_FOLDER_STRUCTURE.md`
- `05_CODING_STANDARDS.md`
- `06_DATABASE_STANDARDS.md`
- `07_REST_API_STANDARDS.md`
- `08_FRONTEND_STANDARDS.md`
- `09_SECURITY_GUIDELINES.md`
- `10_DEPLOYMENT_ARCHITECTURE.md`
- `11_GIT_WORKFLOW.md`
- `12_MODULE_DEVELOPMENT_GUIDE.md`
- `13_ACCOUNTING_ENGINE.md`
- `14_DATABASE_SCHEMA.md`
- `15_API_SPECIFICATION.md`
- `16_UI_SCREEN_SPECIFICATIONS.md`
- `17_TESTING_STRATEGY.md`
- `PROJECT_DIRECTORY.md`

These documents are the only source of truth. Do not contradict them.

## Stack

- **Package manager:** npm Workspaces
- **Backend:** Node.js 22, Express.js, TypeScript, Prisma ORM
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Database:** MySQL
- **Cache:** Redis
- **Queue:** BullMQ
- **Validation:** Zod
- **Authentication:** JWT, Passport.js, Argon2
- **Logging:** Pino
- **Storage:** AWS S3
- **Deployment:** Docker

## Repository Layout

```
ledgerone/
├── apps/
│   ├── api/            Backend (Express.js)
│   └── web/             Frontend (Next.js)
├── packages/
│   ├── shared-types/    DTOs/contracts shared between apps/api and apps/web
│   ├── shared-utils/    Framework-agnostic utilities shared between both apps
│   └── ui/              Shared design-system primitives
├── docker/               Container build/orchestration files
├── scripts/              Repo tooling (setup, db, lint, scaffold)
└── tsconfig.base.json     Shared TypeScript configuration
```

See `04_FOLDER_STRUCTURE.md` for the complete, authoritative folder tree and `PROJECT_DIRECTORY.md` for a generated snapshot of it.

## Getting Started

**Prerequisites:** Node.js version pinned in `.nvmrc` (run `nvm use`), npm ≥10.

```bash
nvm use
cp .env.example .env   # then fill in local values — never commit .env
npm install
```

Workspace-specific scripts are defined in each app/package's own `package.json` as they are introduced.

## License

Proprietary — see [`LICENSE`](./LICENSE). All rights reserved.
