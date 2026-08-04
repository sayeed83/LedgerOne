import { Request, Response } from "express";
import { searchUsers } from "../../../business/search-users.service";
import { UserManagementDependencies } from "../../../business/user-management.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { searchUsersQuerySchema } from "../../dto/requests/search-users-query.dto";
import { toUserResponse } from "../../dto/responses/user.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated — same flagged gap as list-users.controller.ts.
/** `GET /api/v1/users/search?query=` — free-text lookup by name/email within the `X-Tenant-Id` tenant. */
export function searchUsersController(deps: UserManagementDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = searchUsersQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const users = await searchUsers({ tenantId: header.data["x-tenant-id"], query: query.data.query }, deps);

    sendData(res, 200, users.map(toUserResponse));
  });
}
