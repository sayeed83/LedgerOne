// Cross-cutting infrastructure (03_ARCHITECTURE.md Ch.9.8/Decision 9.9.3):
// the Presentation-layer enforcement point for a permission check. Takes a
// structurally-typed `PermissionChecker` port rather than importing
// Authorization's `validateUserPermission`/`PermissionDeniedError`/
// repository directly — scripts/lint/check-module-imports.ts mechanically
// enforces 04_FOLDER_STRUCTURE.md Section 19.3: `common/` may never import
// any module-specific folder, no exception (an earlier version of this file
// did import Authorization's internals directly and was rejected by that
// check). Whoever eventually mounts this onto a real route supplies an
// adapter implementing `PermissionChecker` — e.g. a thin wrapper around
// Authorization's `validateUserPermission` that catches `PermissionDeniedError`
// and returns `false` — built at that module's own composition point, not
// here.
//
// NOT mounted onto any route yet. Per Ch.6.7/Ch.9.5, the actual permission
// *keys* a route requires (`module.resource.action`) are declared by the
// module that owns the capability being gated — but no such key has ever
// been defined anywhere in this codebase for Organization's, User
// Management's, or Authorization's own endpoints (only test fixtures for a
// module — Accounting — that doesn't exist yet). Wiring this onto a real
// route today would mean inventing a permission-key taxonomy that isn't in
// 00_BUSINESS_RULES.md or 03_ARCHITECTURE.md — exactly the "fabricate a
// business rule" CLAUDE.md §13/§14 says to stop and ask about instead of
// assuming. This file is the complete, unit-tested mechanism; attaching it
// to specific routes (with specific keys, and a real `PermissionChecker`
// adapter) is a follow-up decision requiring that taxonomy to be defined
// first. Must run after jwt-auth.middleware.ts and
// current-tenant.middleware.ts — reads `req.user`/`req.tenantId`, never a
// client-supplied identity.
import { NextFunction, Request, Response } from "express";

export interface PermissionChecker {
  hasPermission(input: { tenantId: bigint; userUuid: string; permissionKey: string }): Promise<boolean>;
}

export function createPermissionMiddleware(permissionKey: string, checker: PermissionChecker) {
  return async function permissionMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.user || req.tenantId === undefined) {
      res.status(500).json({
        error: {
          code: "PERMISSION_CONTEXT_MISCONFIGURED",
          message: "permission.middleware.ts requires jwt-auth.middleware.ts and current-tenant.middleware.ts to run first.",
        },
      });
      return;
    }

    try {
      const allowed = await checker.hasPermission({
        tenantId: req.tenantId,
        userUuid: req.user.userUuid,
        permissionKey,
      });

      if (!allowed) {
        res.status(403).json({
          error: {
            code: "AUTHZ_PERMISSION_DENIED",
            message: `User '${req.user.userUuid}' does not have permission '${permissionKey}'.`,
          },
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
