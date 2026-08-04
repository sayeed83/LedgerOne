import { Request, Response } from "express";
import { listCompaniesByTenant } from "../../../business/list-companies-by-tenant.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantUuidParamSchema } from "../../dto/requests/tenant-uuid.schema";
import { toCompanyResponse } from "../../dto/responses/company.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated per 07_REST_API_STANDARDS.md Ch.14's narrow exception for a
// small, business-rule-bounded list — a Tenant's Companies.
/** `GET /api/v1/organization/tenants/:tenantUuid/companies` */
export function listCompaniesByTenantController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const parsed = tenantUuidParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", parsed.error.issues);
      return;
    }

    const companies = await listCompaniesByTenant({ tenantUuid: parsed.data.tenantUuid }, deps);

    sendData(res, 200, companies.map(toCompanyResponse));
  });
}
