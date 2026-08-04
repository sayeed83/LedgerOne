import { Request, Response } from "express";
import { createFinancialYear } from "../../../business/create-financial-year.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createFinancialYearRequestSchema } from "../../dto/requests/create-financial-year.dto";
import { toFinancialYearResponse } from "../../dto/responses/financial-year.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/accounting/financial-years` — defines a new Financial Year for a Company under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.5.1). */
export function createFinancialYearController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createFinancialYearRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const financialYear = await createFinancialYear(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        startDate: body.data.startDate,
        endDate: body.data.endDate,
      },
      deps,
    );

    sendData(res, 201, toFinancialYearResponse(financialYear));
  });
}
