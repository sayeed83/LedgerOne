import { Request, Response } from "express";
import { createFiscalPeriod } from "../../../business/create-fiscal-period.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createFiscalPeriodRequestSchema } from "../../dto/requests/create-fiscal-period.dto";
import { toFiscalPeriodResponse } from "../../dto/responses/fiscal-period.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/accounting/fiscal-periods` — defines a new Fiscal Period within a Financial Year under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.6.1). */
export function createFiscalPeriodController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createFiscalPeriodRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const fiscalPeriod = await createFiscalPeriod(
      {
        tenantId: header.data["x-tenant-id"],
        financialYearUuid: body.data.financialYearUuid,
        startDate: body.data.startDate,
        endDate: body.data.endDate,
      },
      deps,
    );

    sendData(res, 201, toFiscalPeriodResponse(fiscalPeriod));
  });
}
