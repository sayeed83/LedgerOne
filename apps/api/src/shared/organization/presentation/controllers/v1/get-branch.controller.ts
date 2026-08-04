import { Request, Response } from "express";
import { getBranch } from "../../../business/get-branch.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { branchUuidParamSchema } from "../../dto/requests/branch-uuid.schema";
import { toBranchResponse } from "../../dto/responses/branch.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/organization/branches/:branchUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getBranchController(deps: OrganizationDependencies) {
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

    const branch = await getBranch(
      { tenantUuid: header.data["x-tenant-id"], branchUuid: params.data.branchUuid },
      deps,
    );

    sendData(res, 200, toBranchResponse(branch));
  });
}
