import { Request, Response } from "express";
import { getLedgerEntry } from "../../../business/get-ledger-entry.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { ledgerEntryUuidParamSchema } from "../../dto/requests/ledger-entry-uuid.schema";
import { toLedgerEntryDrillDownResponse } from "../../dto/responses/ledger-entry-drilldown.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/**
 * `GET /api/v1/accounting/ledger/entries/:ledgerEntryUuid` — a single
 * Ledger Entry together with the Journal Entry it was posted from
 * (00_BUSINESS_RULES.md Ch.19.11's mandatory drill-down). Read-only, no
 * pagination (a single resource, not a list).
 */
export function getLedgerEntryController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = ledgerEntryUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const drillDown = await getLedgerEntry(
      { tenantId: header.data["x-tenant-id"], ledgerEntryUuid: params.data.ledgerEntryUuid },
      deps,
    );

    sendData(res, 200, toLedgerEntryDrillDownResponse(drillDown));
  });
}
