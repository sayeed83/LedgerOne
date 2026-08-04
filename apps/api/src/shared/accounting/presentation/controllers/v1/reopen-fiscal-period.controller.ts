import { Request, Response } from "express";
import { reopenFiscalPeriod } from "../../../business/reopen-fiscal-period.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { fiscalPeriodUuidParamSchema } from "../../dto/requests/fiscal-period-uuid.schema";
import { toFiscalPeriodResponse } from "../../dto/responses/fiscal-period.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/accounting/fiscal-periods/:fiscalPeriodUuid/reopen` — 00_BUSINESS_RULES.md Ch.6.5/FP-003: Closed -> Reopened, a heavily audited exception. */
export function reopenFiscalPeriodController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = fiscalPeriodUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const fiscalPeriod = await reopenFiscalPeriod(
      { tenantId: header.data["x-tenant-id"], fiscalPeriodUuid: params.data.fiscalPeriodUuid },
      deps,
    );

    sendData(res, 200, toFiscalPeriodResponse(fiscalPeriod));
  });
}
