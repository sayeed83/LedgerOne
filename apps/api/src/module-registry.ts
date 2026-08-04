// Aggregates each completed module's router onto the Express app —
// PROJECT_DIRECTORY.md: "Aggregates every module's module.manifest.ts into
// one catalog server.ts/worker.ts mount against," the physical
// implementation of 03_ARCHITECTURE.md Ch.6.7's module registry concept.
//
// Full manifest-driven aggregation (reading each module's
// `module.manifest.ts` to decide what to mount) isn't built yet — the four
// manifests now exist and describe each module's public contract, but this
// still registers each completed module's router directly, by name.
// Authentication, Organization, User Management, and Authorization are the
// only modules implemented so far.
//
// jwt-auth + current-tenant are mounted ahead of every module except
// Authentication itself: Authentication's own endpoints (login, refresh,
// logout, forgot/reset-password, mfa/verify) are the token-issuing/
// -exchanging endpoints — by definition reachable before a caller holds an
// access token, so they cannot require one. Organization, User Management,
// and Authorization all sit behind a verified identity now — the Foundation
// Readiness Review's top-priority finding (09_SECURITY_GUIDELINES.md
// MTS-001: "never trust a client-supplied tenant ID alone").
//
// Organization's mount omits `rewriteHeaderAs` — see
// common/middleware/current-tenant.middleware.ts's header comment for why
// (Organization's own `X-Tenant-Id` header carries a uuid, which this
// middleware cannot derive from the JWT's numeric `tenantId` claim alone).
import { Express } from "express";
import { createDefaultAuthenticationRouter, createAccessTokenVerifier } from "./shared/authentication";
import { createDefaultOrganizationRouter } from "./shared/organization";
import { createDefaultUserManagementRouter } from "./shared/user-management";
import { createDefaultAuthorizationRouter } from "./shared/authorization";
import { createJwtAuthMiddleware } from "./common/middleware/jwt-auth.middleware";
import { createCurrentTenantMiddleware } from "./common/middleware/current-tenant.middleware";

export function registerModules(app: Express): void {
  app.use("/api/v1/auth", createDefaultAuthenticationRouter());

  // One verifier instance, reused across every protected mount below —
  // each `createJwtAuthMiddleware(...)` call just wraps it as Express
  // middleware, it doesn't re-load keys or re-construct anything.
  const jwtAuthMiddleware = createJwtAuthMiddleware(createAccessTokenVerifier());

  app.use("/api/v1/organization", jwtAuthMiddleware, createCurrentTenantMiddleware(), createDefaultOrganizationRouter());

  app.use(
    "/api/v1/users",
    jwtAuthMiddleware,
    createCurrentTenantMiddleware({ rewriteHeaderAs: "decimal" }),
    createDefaultUserManagementRouter(),
  );

  app.use(
    "/api/v1/authorization",
    jwtAuthMiddleware,
    createCurrentTenantMiddleware({ rewriteHeaderAs: "decimal" }),
    createDefaultAuthorizationRouter(),
  );
}
