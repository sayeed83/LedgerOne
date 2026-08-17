import { Request, Response } from "express";
import { getCashFlow } from "../../../business/reports/get-cash-flow.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { cashFlowQuerySchema } from "../../dto/requests/cash-flow-query.dto";
import { toCashFlowResponse } from "../../dto/responses/cash-flow.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/**
 * `GET /api/v1/accounting/reports/cash-flow` — Cash Flow
 * (00_BUSINESS_RULES.md Ch.27, simplified indirect method — see
 * `get-cash-flow.service.ts`), read-only, scoped to the `X-Tenant-Id`
 * tenant.
 */
export function getCashFlowController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = cashFlowQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const result = await getCashFlow(
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

    sendData(res, 200, toCashFlowResponse(result));
  });
}
