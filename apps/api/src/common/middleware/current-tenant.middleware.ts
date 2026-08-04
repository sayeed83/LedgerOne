// Cross-cutting infrastructure (03_ARCHITECTURE.md MTA-001/09_SECURITY_GUIDELINES.md
// MTS-001: "never trust a client-supplied tenant ID alone"). Must run after
// jwt-auth.middleware.ts — resolves `req.tenantId` exclusively from the
// verified JWT claim populated onto `req.user`, never from a client-supplied
// header or body field.
//
// User Management's and Authorization's own presentation layers already
// read tenant context from an `X-Tenant-Id` header carrying the decimal
// `tenantId` (an explicitly-flagged interim measure — see each module's own
// `tenant-id-header.schema.ts`); rather than rewrite those modules' DTOs
// (out of scope for a frozen module's "bug fix only" status, and each has
// its own passing test suite asserting the current header-parsing
// behavior), `rewriteHeaderAs: "decimal"` overwrites that header in place
// with the verified value before the request reaches the module's router —
// so the module's existing code path is untouched, but the value it reads
// is now server-derived and verified, not client-supplied. Organization's
// own header instead carries a Tenant *uuid* (it alone owns Tenant and can
// resolve one) — this middleware only has the numeric `tenantId` claim, not
// the corresponding uuid, and resolving one would require a cross-module
// call into Organization's repository that no published contract exists
// for yet (03_ARCHITECTURE.md Ch.6.5/6.6.1). Organization's own client-
// supplied uuid header is therefore NOT overwritten here — call
// `createCurrentTenantMiddleware()` with no options for Organization's
// mount, which still requires a verified `req.user` (via jwt-auth) but
// leaves Organization's tenant-uuid resolution exactly as it was. This
// residual gap is flagged, not silently left unflagged: closing it needs
// either an Organization-published `resolveTenantUuid` contract method, or
// moving tenantUuid into the JWT's own claims (an Authentication-owned
// change) — a follow-up design decision, not invented here.
import { NextFunction, Request, Response } from "express";

export interface CurrentTenantMiddlewareOptions {
  rewriteHeaderAs?: "decimal";
}

export function createCurrentTenantMiddleware(options: CurrentTenantMiddlewareOptions = {}) {
  return function currentTenantMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      // Programmer error, not a client error (05_CODING_STANDARDS.md Ch.22.9
      // "fail loudly") — this middleware was mounted without jwt-auth ahead
      // of it, which should never happen at the module-registry.ts mount
      // points that use it.
      res.status(500).json({
        error: {
          code: "TENANT_CONTEXT_MISCONFIGURED",
          message: "current-tenant.middleware.ts requires jwt-auth.middleware.ts to run first.",
        },
      });
      return;
    }

    req.tenantId = req.user.tenantId;

    if (options.rewriteHeaderAs === "decimal") {
      req.headers["x-tenant-id"] = req.tenantId.toString();
    }

    next();
  };
}
