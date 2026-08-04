import { Request, Response } from "express";
import { assignRole } from "../../../business/assign-role.service";
import { AuthorizationDependencies } from "../../../business/authorization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { userUuidParamSchema } from "../../dto/requests/user-uuid.schema";
import { assignRoleRequestSchema } from "../../dto/requests/assign-role.dto";
import { toUserRoleResponse } from "../../dto/responses/user-role.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/authorization/users/:userUuid/roles` — assigns a Role to a User (00_BUSINESS_RULES.md Ch.11.10). */
export function assignRoleController(deps: AuthorizationDependencies) {
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

    const body = assignRoleRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const userRole = await assignRole(
      {
        tenantId: header.data["x-tenant-id"],
        userUuid: params.data.userUuid,
        roleUuid: body.data.roleUuid,
      },
      deps,
    );

    sendData(res, 201, toUserRoleResponse(userRole, body.data.roleUuid));
  });
}
