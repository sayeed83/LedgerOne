import { Request, Response } from "express";
import { removeRole } from "../../../business/remove-role.service";
import { AuthorizationDependencies } from "../../../business/authorization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { userRoleParamsSchema } from "../../dto/requests/user-role-params.schema";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendError, sendNoContent } from "../../support/response-envelope";

/** `DELETE /api/v1/authorization/users/:userUuid/roles/:roleUuid` — removes a Role assignment from a User (00_BUSINESS_RULES.md Ch.11.10). */
export function removeRoleController(deps: AuthorizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = userRoleParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    await removeRole(
      {
        tenantId: header.data["x-tenant-id"],
        userUuid: params.data.userUuid,
        roleUuid: params.data.roleUuid,
      },
      deps,
    );

    sendNoContent(res);
  });
}
