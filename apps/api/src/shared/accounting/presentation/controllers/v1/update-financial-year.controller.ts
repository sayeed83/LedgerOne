import { Request, Response } from "express";
import { updateFinancialYear } from "../../../business/update-financial-year.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { financialYearUuidParamSchema } from "../../dto/requests/financial-year-uuid.schema";
import { updateFinancialYearRequestSchema } from "../../dto/requests/update-financial-year.dto";
import { toFinancialYearResponse } from "../../dto/responses/financial-year.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/accounting/financial-years/:financialYearUuid` — revises start/end dates only; status changes go through the dedicated open/close/reopen endpoints. */
export function updateFinancialYearController(deps: AccountingDependencies) {
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

    const body = updateFinancialYearRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const financialYear = await updateFinancialYear(
      {
        tenantId: header.data["x-tenant-id"],
        financialYearUuid: params.data.financialYearUuid,
        startDate: body.data.startDate,
        endDate: body.data.endDate,
      },
      deps,
    );

    sendData(res, 200, toFinancialYearResponse(financialYear));
  });
}
