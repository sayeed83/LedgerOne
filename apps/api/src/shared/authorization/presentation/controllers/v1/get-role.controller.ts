import { Request, Response } from "express";
import { getRole } from "../../../business/get-role.service";
import { AuthorizationDependencies } from "../../../business/authorization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { roleUuidParamSchema } from "../../dto/requests/role-uuid.schema";
import { toRoleResponse } from "../../dto/responses/role.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/authorization/roles/:roleUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getRoleController(deps: AuthorizationDependencies) {
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

    const role = await getRole({ tenantId: header.data["x-tenant-id"], roleUuid: params.data.roleUuid }, deps);

    sendData(res, 200, toRoleResponse(role));
  });
}
