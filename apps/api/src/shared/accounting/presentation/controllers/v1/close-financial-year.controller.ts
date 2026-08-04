import { Request, Response } from "express";
import { closeFinancialYear } from "../../../business/close-financial-year.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { financialYearUuidParamSchema } from "../../dto/requests/financial-year-uuid.schema";
import { toFinancialYearResponse } from "../../dto/responses/financial-year.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/accounting/financial-years/:financialYearUuid/close` — 00_BUSINESS_RULES.md Ch.5.5: Open/Closing/Reopened -> Closed. */
export function closeFinancialYearController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = financialYearUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const financialYear = await closeFinancialYear(
      { tenantId: header.data["x-tenant-id"], financialYearUuid: params.data.financialYearUuid },
      deps,
    );

    sendData(res, 200, toFinancialYearResponse(financialYear));
  });
}
