import { Request, Response } from "express";
import { createCurrency } from "../../../business/create-currency.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { createCurrencyRequestSchema } from "../../dto/requests/create-currency.dto";
import { toCurrencyResponse } from "../../dto/responses/currency.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// No `X-Tenant-Id` header — Currency is platform-owned reference data
// (00_BUSINESS_RULES.md Ch.7.5, 06_DATABASE_STANDARDS.md MT-005).
/** `POST /api/v1/accounting/currencies` — defines a new Currency (00_BUSINESS_RULES.md Ch.7.1). */
export function createCurrencyController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const body = createCurrencyRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const currency = await createCurrency(
      {
        isoCode: body.data.isoCode,
        name: body.data.name,
        symbol: body.data.symbol,
        decimalPrecision: body.data.decimalPrecision,
      },
      deps,
    );

    sendData(res, 201, toCurrencyResponse(currency));
  });
}
