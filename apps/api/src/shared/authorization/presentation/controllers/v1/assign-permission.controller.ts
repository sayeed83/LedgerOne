import { Request, Response } from "express";
import { assignPermission } from "../../../business/assign-permission.service";
import { AuthorizationDependencies } from "../../../business/authorization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { roleUuidParamSchema } from "../../dto/requests/role-uuid.schema";
import { assignPermissionRequestSchema } from "../../dto/requests/assign-permission.dto";
import { toRolePermissionResponse } from "../../dto/responses/role-permission.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/authorization/roles/:roleUuid/permissions` — grants a Permission to a Role (00_BUSINESS_RULES.md Ch.11.3/Ch.12.10). */
export function assignPermissionController(deps: AuthorizationDependencies) {
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

    const body = assignPermissionRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const rolePermission = await assignPermission(
      {
        tenantId: header.data["x-tenant-id"],
        roleUuid: params.data.roleUuid,
        permissionKey: body.data.permissionKey,
      },
      deps,
    );

    sendData(res, 201, toRolePermissionResponse(rolePermission, params.data.roleUuid, body.data.permissionKey));
  });
}
