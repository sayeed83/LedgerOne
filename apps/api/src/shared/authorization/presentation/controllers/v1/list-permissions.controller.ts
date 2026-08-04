import { Request, Response } from "express";
import { listPermissions } from "../../../business/list-permissions.service";
import { listPermissionsByModule } from "../../../business/list-permissions-by-module.service";
import { AuthorizationDependencies } from "../../../business/authorization.composition";
import { listPermissionsQuerySchema } from "../../dto/requests/list-permissions-query.dto";
import { toPermissionResponse } from "../../dto/responses/permission.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// No `X-Tenant-Id` header — Permission is platform-owned reference data
// (06_DATABASE_STANDARDS.md MT-005), not tenant-scoped.
/** `GET /api/v1/authorization/permissions` — lists every platform-defined Permission, optionally narrowed by `?moduleName=` (00_BUSINESS_RULES.md PRM-001). */
export function listPermissionsController(deps: AuthorizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const query = listPermissionsQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const permissions = query.data.moduleName
      ? await listPermissionsByModule({ moduleName: query.data.moduleName }, deps)
      : await listPermissions(deps);

    sendData(res, 200, permissions.map(toPermissionResponse));
  });
}
