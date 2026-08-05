import { Request, Response } from "express";
import { getAccountLedger } from "../../../business/get-account-ledger.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { accountUuidParamSchema } from "../../dto/requests/account-uuid.schema";
import { ledgerQueryFiltersSchema } from "../../dto/requests/ledger-query-filters.dto";
import { toAccountLedgerResponse, toLedgerPaginationMeta } from "../../dto/responses/account-ledger.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/**
 * `GET /api/v1/accounting/ledger/accounts/:accountUuid` — the General
 * Ledger read model's canonical per-account view (00_BUSINESS_RULES.md
 * Ch.19.1), scoped to the `X-Tenant-Id` tenant. Read-only — never
 * create/update/delete (this endpoint has no write counterpart at all;
 * Ledger Entries are only ever an internal side effect of
 * `POST .../journal-entries/:uuid/post`, Ch.19.18).
 */
export function getAccountLedgerController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = accountUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const query = ledgerQueryFiltersSchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const result = await getAccountLedger(
      {
        tenantId: header.data["x-tenant-id"],
        accountUuid: params.data.accountUuid,
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
