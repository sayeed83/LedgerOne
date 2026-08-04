import { Request, Response } from "express";
import { suspendUser } from "../../../business/suspend-user.service";
import { UserManagementDependencies } from "../../../business/user-management.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { userUuidParamSchema } from "../../dto/requests/user-uuid.schema";
import { toUserResponse } from "../../dto/responses/user.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/users/:userUuid/suspend` — 00_BUSINESS_RULES.md Ch.10.5: Active -> Suspended. */
export function suspendUserController(deps: UserManagementDependencies) {
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

    const user = await suspendUser(
      { tenantId: header.data["x-tenant-id"], userUuid: params.data.userUuid },
      deps,
    );

    sendData(res, 200, toUserResponse(user));
  });
}
