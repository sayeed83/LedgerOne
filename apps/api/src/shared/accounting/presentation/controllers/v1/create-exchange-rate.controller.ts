import { Request, Response } from "express";
import { createExchangeRate } from "../../../business/create-exchange-rate.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { DecimalValue } from "../../../business/accounting-types";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createExchangeRateRequestSchema } from "../../dto/requests/create-exchange-rate.dto";
import { toExchangeRateResponse } from "../../dto/responses/exchange-rate.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/accounting/exchange-rates` — defines a new Exchange Rate for a currency pair and effective date under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.31.1). */
export function createExchangeRateController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createExchangeRateRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    // `DecimalValue.create` may throw `InvalidDecimalValueError` (a
    // `DomainError`) — caught by `handleDomainErrors` exactly like any error
    // thrown from the Business-layer call below (05_CODING_STANDARDS.md
    // Ch.15.4 — the Value Object enforces its own invariant, once).
    const exchangeRate = await createExchangeRate(
      {
        tenantId: header.data["x-tenant-id"],
        fromCurrencyUuid: body.data.fromCurrencyUuid,
        toCurrencyUuid: body.data.toCurrencyUuid,
        rate: DecimalValue.create(body.data.rate),
        effectiveDate: body.data.effectiveDate,
      },
      deps,
    );

    sendData(res, 201, toExchangeRateResponse(exchangeRate));
  });
}
