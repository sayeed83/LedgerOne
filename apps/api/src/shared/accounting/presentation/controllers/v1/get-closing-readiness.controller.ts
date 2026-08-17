import { Request, Response } from "express";
import { getClosingReadiness } from "../../../business/reports/get-closing-readiness.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { closingReadinessQuerySchema } from "../../dto/requests/closing-readiness-query.dto";
import { toClosingReadinessResponse } from "../../dto/responses/closing-readiness.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/**
 * `GET /api/v1/accounting/reports/closing-readiness` — Financial Closing
 * (00_BUSINESS_RULES.md Ch.32), READ-ONLY readiness check, scoped to the
 * `X-Tenant-Id` tenant. Never posts/closes/approves anything — this epic
 * implements no closing action at all, only the CLS-001/CLS-002 readiness
 * signal a future Financial Closing module's own mutation endpoint would
 * check before proceeding.
 */
export function getClosingReadinessController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = closingReadinessQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const result = await getClosingReadiness(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: query.data.companyUuid,
        fiscalPeriodUuid: query.data.fiscalPeriodUuid,
      },
      deps,
    );

    sendData(res, 200, toClosingReadinessResponse(result));
  });
}
