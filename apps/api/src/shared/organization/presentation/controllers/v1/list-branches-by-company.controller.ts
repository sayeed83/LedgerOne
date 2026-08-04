import { Request, Response } from "express";
import { listBranchesByCompany } from "../../../business/list-branches-by-company.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { companyUuidParamSchema } from "../../dto/requests/company-uuid.schema";
import { toBranchResponse } from "../../dto/responses/branch.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated per 07_REST_API_STANDARDS.md Ch.14's narrow exception for a
// small, business-rule-bounded list — a Company's Branches.
/** `GET /api/v1/organization/companies/:companyUuid/branches` — scoped to the `X-Tenant-Id` tenant. */
export function listBranchesByCompanyController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = companyUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const branches = await listBranchesByCompany(
      { tenantUuid: header.data["x-tenant-id"], companyUuid: params.data.companyUuid },
      deps,
    );

    sendData(res, 200, branches.map(toBranchResponse));
  });
}
