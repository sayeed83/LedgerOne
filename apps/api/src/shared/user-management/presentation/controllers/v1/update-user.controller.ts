import { Request, Response } from "express";
import { updateUser } from "../../../business/update-user.service";
import { UserManagementDependencies } from "../../../business/user-management.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { userUuidParamSchema } from "../../dto/requests/user-uuid.schema";
import { updateUserRequestSchema } from "../../dto/requests/update-user.dto";
import { toUserResponse } from "../../dto/responses/user.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/users/:userUuid` — revises identifying/contact details and organizational assignment only; status changes go through the dedicated activate/suspend/deactivate endpoints. */
export function updateUserController(deps: UserManagementDependencies) {
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

    const body = updateUserRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const user = await updateUser(
      {
        tenantId: header.data["x-tenant-id"],
        userUuid: params.data.userUuid,
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

    sendData(res, 200, toUserResponse(user));
  });
}
