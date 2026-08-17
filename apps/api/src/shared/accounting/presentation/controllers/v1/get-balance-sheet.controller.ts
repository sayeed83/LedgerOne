import { Request, Response } from "express";
import { getBalanceSheet } from "../../../business/reports/get-balance-sheet.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { balanceSheetQuerySchema } from "../../dto/requests/balance-sheet-query.dto";
import { toBalanceSheetResponse } from "../../dto/responses/balance-sheet.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/**
 * `GET /api/v1/accounting/reports/balance-sheet` — Balance Sheet
 * (00_BUSINESS_RULES.md Ch.26), read-only, scoped to the `X-Tenant-Id`
 * tenant.
 */
export function getBalanceSheetController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = balanceSheetQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const result = await getBalanceSheet(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: query.data.companyUuid,
        asOfDate: query.data.asOfDate,
        fiscalPeriodUuid: query.data.fiscalPeriodUuid,
        financialYearUuid: query.data.financialYearUuid,
      },
      deps,
    );

    sendData(res, 200, toBalanceSheetResponse(result));
  });
}
