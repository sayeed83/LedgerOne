import { Request, Response } from "express";
import { createBranch } from "../../../business/create-branch.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createBranchRequestSchema } from "../../dto/requests/create-branch.dto";
import { toBranchResponse } from "../../dto/responses/branch.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/organization/branches` — registers a new Branch under the Company named in the body, scoped to the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md BRN-001). */
export function createBranchController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createBranchRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const branch = await createBranch(
      {
        tenantUuid: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
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

    sendData(res, 201, toBranchResponse(branch));
  });
}
