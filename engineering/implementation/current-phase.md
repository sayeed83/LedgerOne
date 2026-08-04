# Current Phase

**Purpose:** The single source of truth for "what phase/module are we actively working on right now." This is the most frequently updated file in [implementation/](.) — check it first before starting new work.

**Contents:** The active phase (referencing [roadmap.md](roadmap.md)), what's in progress, what's blocked, and what's next.

**When it should be used:** Read at the start of any implementation session to orient on current priorities. Update immediately whenever the active phase or its status changes — do not let this file go stale.

---

## Active Phase

**Phase:** 02 — Platform

**Status:** In progress

**Completed:** Phase 00 — Setup (workspace/tooling scaffolding, lint/DB scripts, local dev environment verified end-to-end). Phase 01 — Foundation is deliberately deferred (not started) — the Platform phase was reprioritized ahead of it per explicit direction, since Authentication has no dependency on the ledger/domain-primitive work Foundation covers.

**Completed (continued):** Authentication module (credentials, sessions, login, passwords, MFA — database, business, presentation layers) and Organization module (tenant, company, branch, department — database layer) shipped and frozen. Module ownership boundaries confirmed: Authentication (credentials, sessions, login, passwords, MFA), User Management (profile, status, personal information), Authorization (roles, permissions), Organization (tenant, company, branch, department).

**Completed (continued):** User Management — Database Layer. Canonical `User` model (`apps/api/src/database/schema/user-management.prisma`) — personal identity, contact, `UserStatus` lifecycle (Invited/Active/Suspended/Deactivated per Ch.10.5), cross-module references to Organization (`companyUuid`/`branchUuid`/`departmentUuid`, FK-002 uuid-reference pattern). Deliberately excludes employment fields (employeeCode/designation/joiningDate) — those belong to a future, distinct Employee entity (Payroll module, Ch.75, EMP-004 bounded-context separation). Migration `20260804115244_user_management_create_tables` applied and verified against local MySQL.

**Completed (continued):** User Management — Repository Layer. `apps/api/src/shared/user-management/domain/{aggregates,enums,errors,interfaces}` (User aggregate with Ch.10.5 transition methods, `UserStatus` enum, `IUserManagementRepository`) and `repository/user-management.repository.ts` (`PrismaUserManagementRepository`) mirroring Organization/Authentication's exact repository pattern. Verified against local MySQL via a temporary script (deleted after the run).

**Completed (continued):** User Management — Business Layer. `apps/api/src/shared/user-management/business/` — `create-user`/`invite-user` (Ch.10.6 onboarding), `get-user`, `update-user`, `activate-user`/`suspend-user`/`deactivate-user` (Ch.10.5 transitions), `list-users`, `search-users`, `validate-user-active`, plus `user-management.composition.ts` and `test-support/fixtures.ts`. Every service depends only on `IUserManagementRepository`.

**Completed (continued):** User Management — Presentation Layer. `apps/api/src/shared/user-management/presentation/` (controllers/v1, dto/{requests,responses}, support) and `index.ts` mirroring Organization/Authentication's exact pattern. Mounted at `/api/v1/users` via `module-registry.ts`. Exposes 9 endpoints (create, invite, get, update, activate, suspend, deactivate, list, search) — `validateUserActive` deliberately has no endpoint, mirroring Organization's own `validateTenantIsActive` guard.

**Completed (continued):** User Management — Application Integration. Verified the module-registry/composition-root/server-boot wiring done alongside the Presentation milestone was already complete and correct (no further code changes needed this pass): `module-registry.ts` mounts `createDefaultUserManagementRouter()` at `/api/v1/users` alongside Authentication's `/api/v1/auth` and Organization's `/api/v1/organization`, all three built the same way (composition root → default router factory → `registerModules`). Confirmed live by running the real app (`tsx src/server.ts`) against local MySQL and exercising all 9 endpoints end-to-end with real fixture data (a real Tenant + Company created via Organization's own API) — create, invite, get, update, activate, suspend, deactivate, list (tenant-wide and `?companyUuid=`-filtered), and search all returned correct data; 422 (missing header), 404 (`USR_USER_NOT_FOUND`), and 409 (`USR_DUPLICATE_EMAIL`, `USR_INVALID_STATUS_TRANSITION`) error paths all confirmed live. Re-verified `/health`, `POST /api/v1/auth/login` validation, and `GET /api/v1/organization/tenants/:uuid` against the same running app to confirm Authentication/Organization are unaffected. Fixture data cleaned up afterward. `npm run typecheck -w apps/api` and `npm test -w apps/api` still pass (296 tests, 48 suites).

**Completed (continued):** User Management — API Testing. `engineering/testing/user-management/{UserManagement.postman_collection.json, LedgerOne.postman_environment.json}`, mirroring Authentication's/Organization's exact structure — one collection + one environment, per-resource folder, `pm.collectionVariables.set` UUID chaining, envelope/error-code assertions. Self-contained by design: uses a fixed test `{{tenantId}}`/`{{companyUuid}}` rather than chaining a real Tenant/Company through Organization's collection, since `users.tenant_id`/`users.company_uuid` carry no DB-level FK (FK-002) and the Business layer never validates them cross-module — and because User Management's `X-Tenant-Id` header needs the tenant's *numeric* id, which no HTTP endpoint anywhere exposes (PK-003), mirroring why Authentication's own collection hardcodes `tenantId=1`. Uses `{{$randomEmail}}` so repeated runs never collide on Ch.10.8's email-uniqueness rule. Verified twice via `npx newman run` against the real app (`tsx src/server.ts`) and local MySQL: 26/26 requests, 56/56 assertions, 0 failures both times. Confirmed Authentication/Organization endpoints unaffected. Test data cleaned up after each run.

**Blocked:** _None_

**Next up:** Proceed to the Authorization module (roles, permissions) per the roadmap.
