import { Request, Response } from "express";
import { listUserRoles } from "../../../business/list-user-roles.service";
import { AuthorizationDependencies } from "../../../business/authorization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { userUuidParamSchema } from "../../dto/requests/user-uuid.schema";
import { toRoleResponse } from "../../dto/responses/role.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/authorization/users/:userUuid/roles` — lists the Roles currently assigned to a User (00_BUSINESS_RULES.md Ch.11.10). */
export function listUserRolesController(deps: AuthorizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = userUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const roles = await listUserRoles({ tenantId: header.data["x-tenant-id"], userUuid: params.data.userUuid }, deps);

    sendData(res, 200, roles.map(toRoleResponse));
  });
}
