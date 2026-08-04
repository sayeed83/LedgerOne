import { Request, Response } from "express";
import { removePermission } from "../../../business/remove-permission.service";
import { AuthorizationDependencies } from "../../../business/authorization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { rolePermissionParamsSchema } from "../../dto/requests/role-permission-params.schema";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendError, sendNoContent } from "../../support/response-envelope";

/** `DELETE /api/v1/authorization/roles/:roleUuid/permissions/:permissionKey` — revokes a Permission grant from a Role (00_BUSINESS_RULES.md Ch.11.3/Ch.12.10). */
export function removePermissionController(deps: AuthorizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = rolePermissionParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    await removePermission(
      {
        tenantId: header.data["x-tenant-id"],
        roleUuid: params.data.roleUuid,
        permissionKey: params.data.permissionKey,
      },
      deps,
    );

    sendNoContent(res);
  });
}
