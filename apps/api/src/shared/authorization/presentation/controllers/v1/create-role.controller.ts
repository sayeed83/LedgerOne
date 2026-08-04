import { Request, Response } from "express";
import { createRole } from "../../../business/create-role.service";
import { AuthorizationDependencies } from "../../../business/authorization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createRoleRequestSchema } from "../../dto/requests/create-role.dto";
import { toRoleResponse } from "../../dto/responses/role.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/authorization/roles` — registers a new Role under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.11.1). */
export function createRoleController(deps: AuthorizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createRoleRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const role = await createRole(
      {
        tenantId: header.data["x-tenant-id"],
        name: body.data.name,
        description: body.data.description,
      },
      deps,
    );

    sendData(res, 201, toRoleResponse(role));
  });
}
