import { Request, Response } from "express";
import { listUsers } from "../../../business/list-users.service";
import { UserManagementDependencies } from "../../../business/user-management.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listUsersQuerySchema } from "../../dto/requests/list-users-query.dto";
import { toUserResponse } from "../../dto/responses/user.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated (07_REST_API_STANDARDS.md Ch.14 otherwise mandates
// cursor-based pagination for a list endpoint) — a known, flagged gap, not
// an application of Organization's narrow "small, business-rule-bounded
// list" exception: a Tenant's Users have no such bound. The approved
// Repository layer (`IUserManagementRepository.listUsersByTenant`/
// `listUsersByCompany`) exposes no cursor/limit parameter to build real
// pagination on top of, and extending it is out of scope for this
// Presentation-layer milestone.
/** `GET /api/v1/users` — lists Users within the `X-Tenant-Id` tenant, optionally narrowed by `?companyUuid=`. */
export function listUsersController(deps: UserManagementDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listUsersQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const users = await listUsers(
      { tenantId: header.data["x-tenant-id"], companyUuid: query.data.companyUuid },
      deps,
    );

    sendData(res, 200, users.map(toUserResponse));
  });
}
