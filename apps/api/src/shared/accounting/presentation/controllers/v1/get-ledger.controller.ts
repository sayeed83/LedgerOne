import { Request, Response } from "express";
import { getAccountLedger } from "../../../business/get-account-ledger.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { getLedgerQuerySchema } from "../../dto/requests/get-ledger-query.dto";
import { toAccountLedgerResponse, toLedgerPaginationMeta } from "../../dto/responses/account-ledger.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/**
 * `GET /api/v1/accounting/ledger?accountUuid=...` — the query-param
 * equivalent of `GET /ledger/accounts/:accountUuid`, calling the exact same
 * `getAccountLedger` use case. Kept as a distinct route (rather than the
 * only one) purely for URL ergonomics matching this milestone's suggested
 * route list — 00_BUSINESS_RULES.md Ch.19.1 defines a Ledger strictly as a
 * per-account concept, so `accountUuid` is REQUIRED here too, never
 * optional: there is no handbook notion of a cross-account, commingled raw
 * entry feed for this endpoint to fall back to (that would be Trial
 * Balance, Ch.24, out of scope this milestone, and itself just a
 * per-account aggregation, not a raw feed). Read-only.
 */
export function getLedgerController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = getLedgerQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const result = await getAccountLedger(
      {
        tenantId: header.data["x-tenant-id"],
        accountUuid: query.data.accountUuid,
        companyUuid: query.data.companyUuid,
        dateFrom: query.data.dateFrom,
        dateTo: query.data.dateTo,
        cursor: query.data.cursor,
        limit: query.data.pageSize,
      },
      deps,
    );

    sendData(res, 200, toAccountLedgerResponse(result), toLedgerPaginationMeta(result));
  });
}
