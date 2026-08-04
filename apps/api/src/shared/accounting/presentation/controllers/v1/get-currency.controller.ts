import { Request, Response } from "express";
import { getCurrency } from "../../../business/get-currency.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { currencyUuidParamSchema } from "../../dto/requests/currency-uuid.schema";
import { toCurrencyResponse } from "../../dto/responses/currency.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// No `X-Tenant-Id` header — Currency is platform-owned reference data
// (00_BUSINESS_RULES.md Ch.7.5, 06_DATABASE_STANDARDS.md MT-005).
/** `GET /api/v1/accounting/currencies/:currencyUuid`. */
export function getCurrencyController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const params = currencyUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const currency = await getCurrency({ currencyUuid: params.data.currencyUuid }, deps);

    sendData(res, 200, toCurrencyResponse(currency));
  });
}
