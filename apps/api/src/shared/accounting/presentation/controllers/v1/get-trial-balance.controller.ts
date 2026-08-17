import { Request, Response } from "express";
import { getTrialBalance } from "../../../business/reports/get-trial-balance.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { trialBalanceQuerySchema } from "../../dto/requests/trial-balance-query.dto";
import { toTrialBalanceResponse, toTrialBalancePaginationMeta } from "../../dto/responses/trial-balance.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/**
 * `GET /api/v1/accounting/reports/trial-balance` — Trial Balance
 * (00_BUSINESS_RULES.md Ch.24), read-only, scoped to the `X-Tenant-Id`
 * tenant. Never inserts/updates/deletes/posts/approves/reverses anything —
 * a derived report over the existing Ledger/Chart of Accounts data only.
 */
export function getTrialBalanceController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = trialBalanceQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const result = await getTrialBalance(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: query.data.companyUuid,
        asOfDate: query.data.asOfDate,
        fiscalPeriodUuid: query.data.fiscalPeriodUuid,
        financialYearUuid: query.data.financialYearUuid,
        includeZeroActivity: query.data.includeZeroActivity,
        cursor: query.data.cursor,
        limit: query.data.limit,
      },
      deps,
    );

    sendData(res, 200, toTrialBalanceResponse(result), toTrialBalancePaginationMeta(result));
  });
}
