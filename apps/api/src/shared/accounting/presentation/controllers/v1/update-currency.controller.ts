import { Request, Response } from "express";
import { updateCurrency } from "../../../business/update-currency.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { currencyUuidParamSchema } from "../../dto/requests/currency-uuid.schema";
import { updateCurrencyRequestSchema } from "../../dto/requests/update-currency.dto";
import { toCurrencyResponse } from "../../dto/responses/currency.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// No `X-Tenant-Id` header — Currency is platform-owned reference data
// (00_BUSINESS_RULES.md Ch.7.5, 06_DATABASE_STANDARDS.md MT-005).
/** `PUT /api/v1/accounting/currencies/:currencyUuid` — revises name/symbol/decimalPrecision only; status changes go through the dedicated activate/deactivate endpoints. */
export function updateCurrencyController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const params = currencyUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const body = updateCurrencyRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const currency = await updateCurrency(
      {
        currencyUuid: params.data.currencyUuid,
        name: body.data.name,
        symbol: body.data.symbol,
        decimalPrecision: body.data.decimalPrecision,
      },
      deps,
    );

    sendData(res, 200, toCurrencyResponse(currency));
  });
}
