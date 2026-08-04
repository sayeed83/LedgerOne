import { Request, Response } from "express";
import { updateFiscalPeriod } from "../../../business/update-fiscal-period.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { fiscalPeriodUuidParamSchema } from "../../dto/requests/fiscal-period-uuid.schema";
import { updateFiscalPeriodRequestSchema } from "../../dto/requests/update-fiscal-period.dto";
import { toFiscalPeriodResponse } from "../../dto/responses/fiscal-period.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/accounting/fiscal-periods/:fiscalPeriodUuid` — revises start/end dates only; status changes go through the dedicated soft-close/close/reopen endpoints. Rejected outright (409) when the period is already Closed (00_BUSINESS_RULES.md Ch.6.8). */
export function updateFiscalPeriodController(deps: AccountingDependencies) {
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

    const body = updateFiscalPeriodRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const fiscalPeriod = await updateFiscalPeriod(
      {
        tenantId: header.data["x-tenant-id"],
        fiscalPeriodUuid: params.data.fiscalPeriodUuid,
        startDate: body.data.startDate,
        endDate: body.data.endDate,
      },
      deps,
    );

    sendData(res, 200, toFiscalPeriodResponse(fiscalPeriod));
  });
}
