import { Request, Response } from "express";
import { listCurrencies } from "../../../business/list-currencies.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { listCurrenciesQuerySchema } from "../../dto/requests/list-currencies-query.dto";
import { toCurrencyResponse } from "../../dto/responses/currency.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// No `X-Tenant-Id` header — Currency is platform-owned reference data
// (00_BUSINESS_RULES.md Ch.7.5, 06_DATABASE_STANDARDS.md MT-005), mirroring
// Authorization's list-permissions.controller.ts. Unpaginated, same flagged
// gap as every other list endpoint in this module (Repository layer exposes
// no cursor/limit parameter).
/** `GET /api/v1/accounting/currencies` — lists every Currency, optionally narrowed by `?status=`. */
export function listCurrenciesController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const query = listCurrenciesQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const currencies = await listCurrencies({ status: query.data.status }, deps);

    sendData(res, 200, currencies.map(toCurrencyResponse));
  });
}
