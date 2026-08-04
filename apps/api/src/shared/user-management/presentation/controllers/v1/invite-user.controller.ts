import { Request, Response } from "express";
import { inviteUser } from "../../../business/invite-user.service";
import { UserManagementDependencies } from "../../../business/user-management.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { inviteUserRequestSchema } from "../../dto/requests/invite-user.dto";
import { toUserResponse } from "../../dto/responses/user.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/users/invite` — Ch.10.6's named onboarding workflow ("Organization Administrator invites User by email"); same persistence as `createUser`, exposed under the business-vocabulary path. */
export function inviteUserController(deps: UserManagementDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = inviteUserRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const user = await inviteUser(
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
