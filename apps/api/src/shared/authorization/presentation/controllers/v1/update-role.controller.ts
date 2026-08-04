import { Request, Response } from "express";
import { updateRole } from "../../../business/update-role.service";
import { AuthorizationDependencies } from "../../../business/authorization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { roleUuidParamSchema } from "../../dto/requests/role-uuid.schema";
import { updateRoleRequestSchema } from "../../dto/requests/update-role.dto";
import { toRoleResponse } from "../../dto/responses/role.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/authorization/roles/:roleUuid` — revises name/description only; status changes go through the dedicated retire endpoint. */
export function updateRoleController(deps: AuthorizationDependencies) {
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

    const body = updateRoleRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const role = await updateRole(
      {
        tenantId: header.data["x-tenant-id"],
        roleUuid: params.data.roleUuid,
        name: body.data.name,
        description: body.data.description,
      },
      deps,
    );

    sendData(res, 200, toRoleResponse(role));
  });
}
