import { Request, Response } from "express";
import { getUser } from "../../../business/get-user.service";
import { UserManagementDependencies } from "../../../business/user-management.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { userUuidParamSchema } from "../../dto/requests/user-uuid.schema";
import { toUserResponse } from "../../dto/responses/user.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/users/:userUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getUserController(deps: UserManagementDependencies) {
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

    const user = await getUser({ tenantId: header.data["x-tenant-id"], userUuid: params.data.userUuid }, deps);

    sendData(res, 200, toUserResponse(user));
  });
}
