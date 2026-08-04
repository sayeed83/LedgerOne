import { Request, Response } from "express";
import { updateBranch } from "../../../business/update-branch.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { branchUuidParamSchema } from "../../dto/requests/branch-uuid.schema";
import { updateBranchRequestSchema } from "../../dto/requests/update-branch.dto";
import { toBranchResponse } from "../../dto/responses/branch.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/organization/branches/:branchUuid` — revises identifying/address details only; status transitions are not part of this milestone. */
export function updateBranchController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = branchUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const body = updateBranchRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const branch = await updateBranch(
      {
        tenantUuid: header.data["x-tenant-id"],
        branchUuid: params.data.branchUuid,
        branchCode: body.data.branchCode,
        branchName: body.data.branchName,
        addressLine1: body.data.addressLine1,
        addressLine2: body.data.addressLine2,
        city: body.data.city,
        region: body.data.region,
        postalCode: body.data.postalCode,
        countryCode: body.data.countryCode,
        timeZone: body.data.timeZone,
      },
      deps,
    );

    sendData(res, 200, toBranchResponse(branch));
  });
}
