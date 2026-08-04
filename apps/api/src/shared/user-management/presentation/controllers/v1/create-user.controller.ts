import { Request, Response } from "express";
import { createUser } from "../../../business/create-user.service";
import { UserManagementDependencies } from "../../../business/user-management.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createUserRequestSchema } from "../../dto/requests/create-user.dto";
import { toUserResponse } from "../../dto/responses/user.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/users` — registers a new User under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md USR-001). */
export function createUserController(deps: UserManagementDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createUserRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const user = await createUser(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        branchUuid: body.data.branchUuid,
        departmentUuid: body.data.departmentUuid,
        firstName: body.data.firstName,
        middleName: body.data.middleName,
        lastName: body.data.lastName,
        displayName: body.data.displayName,
        email: body.data.email,
        mobileNumber: body.data.mobileNumber,
      },
      deps,
    );

    sendData(res, 201, toUserResponse(user));
  });
}
