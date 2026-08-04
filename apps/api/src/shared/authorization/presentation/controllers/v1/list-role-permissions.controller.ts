import { Request, Response } from "express";
import { listRolePermissions } from "../../../business/list-role-permissions.service";
import { AuthorizationDependencies } from "../../../business/authorization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { roleUuidParamSchema } from "../../dto/requests/role-uuid.schema";
import { toPermissionResponse } from "../../dto/responses/permission.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/authorization/roles/:roleUuid/permissions` — lists the Permissions currently granted to a Role (00_BUSINESS_RULES.md Ch.11.3/Ch.12.10). */
export function listRolePermissionsController(deps: AuthorizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = roleUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const permissions = await listRolePermissions(
      { tenantId: header.data["x-tenant-id"], roleUuid: params.data.roleUuid },
      deps,
    );

    sendData(res, 200, permissions.map(toPermissionResponse));
  });
}
