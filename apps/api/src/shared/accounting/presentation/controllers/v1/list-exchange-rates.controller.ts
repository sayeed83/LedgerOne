import { Request, Response } from "express";
import { listExchangeRates } from "../../../business/list-exchange-rates.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listExchangeRatesQuerySchema } from "../../dto/requests/list-exchange-rates-query.dto";
import { toExchangeRateResponse } from "../../dto/responses/exchange-rate.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every other list endpoint in this module.
/** `GET /api/v1/accounting/exchange-rates` — lists Exchange Rates within the `X-Tenant-Id` tenant, optionally narrowed by `?fromCurrencyUuid=`/`?toCurrencyUuid=`. */
export function listExchangeRatesController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listExchangeRatesQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const exchangeRates = await listExchangeRates(
      {
        tenantId: header.data["x-tenant-id"],
        fromCurrencyUuid: query.data.fromCurrencyUuid,
        toCurrencyUuid: query.data.toCurrencyUuid,
      },
      deps,
    );

    sendData(res, 200, exchangeRates.map(toExchangeRateResponse));
  });
}
