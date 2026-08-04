import { Request, Response } from "express";
import { closeCompany } from "../../../business/close-company.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { companyUuidParamSchema } from "../../dto/requests/company-uuid.schema";
import { toCompanyResponse } from "../../dto/responses/company.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/organization/companies/:companyUuid/close` — 00_BUSINESS_RULES.md Ch.2.6: Active -> Closed. */
export function closeCompanyController(deps: OrganizationDependencies) {
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

    const company = await closeCompany(
      { tenantUuid: header.data["x-tenant-id"], companyUuid: params.data.companyUuid },
      deps,
    );

    sendData(res, 200, toCompanyResponse(company));
  });
}
