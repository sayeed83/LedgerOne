import { Request, Response } from "express";
import { getExchangeRate } from "../../../business/get-exchange-rate.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { exchangeRateUuidParamSchema } from "../../dto/requests/exchange-rate-uuid.schema";
import { toExchangeRateResponse } from "../../dto/responses/exchange-rate.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/accounting/exchange-rates/:exchangeRateUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getExchangeRateController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = exchangeRateUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const exchangeRate = await getExchangeRate(
      { tenantId: header.data["x-tenant-id"], exchangeRateUuid: params.data.exchangeRateUuid },
      deps,
    );

    sendData(res, 200, toExchangeRateResponse(exchangeRate));
  });
}
