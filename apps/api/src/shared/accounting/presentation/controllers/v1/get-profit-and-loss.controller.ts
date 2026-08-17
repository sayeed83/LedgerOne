import { Request, Response } from "express";
import { getProfitAndLoss } from "../../../business/reports/get-profit-and-loss.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { profitAndLossQuerySchema } from "../../dto/requests/profit-and-loss-query.dto";
import { toProfitAndLossResponse } from "../../dto/responses/profit-and-loss.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/**
 * `GET /api/v1/accounting/reports/profit-and-loss` — Profit & Loss
 * (00_BUSINESS_RULES.md Ch.25), read-only, scoped to the `X-Tenant-Id`
 * tenant.
 */
export function getProfitAndLossController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = profitAndLossQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const result = await getProfitAndLoss(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: query.data.companyUuid,
        fiscalPeriodUuid: query.data.fiscalPeriodUuid,
        financialYearUuid: query.data.financialYearUuid,
        dateFrom: query.data.dateFrom,
        dateTo: query.data.dateTo,
      },
      deps,
    );

    sendData(res, 200, toProfitAndLossResponse(result));
  });
}
