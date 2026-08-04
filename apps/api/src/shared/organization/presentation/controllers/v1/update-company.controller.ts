import { Request, Response } from "express";
import { updateCompany } from "../../../business/update-company.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { companyUuidParamSchema } from "../../dto/requests/company-uuid.schema";
import { updateCompanyRequestSchema } from "../../dto/requests/update-company.dto";
import { toCompanyResponse } from "../../dto/responses/company.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/organization/companies/:companyUuid` — revises identifying details only; status changes go through the dedicated activate/close endpoints. */
export function updateCompanyController(deps: OrganizationDependencies) {
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

    const body = updateCompanyRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const company = await updateCompany(
      {
        tenantUuid: header.data["x-tenant-id"],
        companyUuid: params.data.companyUuid,
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

    sendData(res, 200, toCompanyResponse(company));
  });
}
