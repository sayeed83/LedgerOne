import { Request, Response } from "express";
import { listFiscalPeriods } from "../../../business/list-fiscal-periods.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listFiscalPeriodsQuerySchema } from "../../dto/requests/list-fiscal-periods-query.dto";
import { toFiscalPeriodResponse } from "../../dto/responses/fiscal-period.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated (07_REST_API_STANDARDS.md Ch.14 otherwise mandates
// cursor-based pagination for a list endpoint) — same flagged gap as
// list-financial-years.controller.ts: the approved Repository layer
// (`IAccountingRepository.listFiscalPeriods`) exposes no cursor/limit
// parameter to build real pagination on top of.
/** `GET /api/v1/accounting/fiscal-periods` — lists Fiscal Periods within the `X-Tenant-Id` tenant, optionally narrowed by `?financialYearUuid=`. */
export function listFiscalPeriodsController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listFiscalPeriodsQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const fiscalPeriods = await listFiscalPeriods(
      { tenantId: header.data["x-tenant-id"], financialYearUuid: query.data.financialYearUuid },
      deps,
    );

    sendData(res, 200, fiscalPeriods.map(toFiscalPeriodResponse));
  });
}
