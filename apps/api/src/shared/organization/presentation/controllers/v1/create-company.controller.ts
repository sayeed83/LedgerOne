import { Request, Response } from "express";
import { createCompany } from "../../../business/create-company.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createCompanyRequestSchema } from "../../dto/requests/create-company.dto";
import { toCompanyResponse } from "../../dto/responses/company.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/organization/companies` — registers a new Company under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md CMP-001). */
export function createCompanyController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createCompanyRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const company = await createCompany(
      {
        tenantUuid: header.data["x-tenant-id"],
        companyCode: body.data.companyCode,
        legalName: body.data.legalName,
        displayName: body.data.displayName,
        legalEntityType: body.data.legalEntityType,
        taxRegistrationNumber: body.data.taxRegistrationNumber,
        baseCurrencyCode: body.data.baseCurrencyCode,
        country: body.data.country,
        timeZone: body.data.timeZone,
        financialYearStartMonth: body.data.financialYearStartMonth,
        financialYearStartDay: body.data.financialYearStartDay,
      },
      deps,
    );

    sendData(res, 201, toCompanyResponse(company));
  });
}
