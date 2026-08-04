import { Request, Response } from "express";
import { listRoles } from "../../../business/list-roles.service";
import { AuthorizationDependencies } from "../../../business/authorization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { toRoleResponse } from "../../dto/responses/role.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated (07_REST_API_STANDARDS.md Ch.14 otherwise mandates
// cursor-based pagination for a list endpoint) — same flagged gap as User
// Management's list-users.controller.ts: the approved Repository layer
// (`IAuthorizationRepository.listRoles`) exposes no cursor/limit parameter
// to build real pagination on top of.
/** `GET /api/v1/authorization/roles` — lists Roles within the `X-Tenant-Id` tenant. */
export function listRolesController(deps: AuthorizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const roles = await listRoles({ tenantId: header.data["x-tenant-id"] }, deps);

    sendData(res, 200, roles.map(toRoleResponse));
  });
}
