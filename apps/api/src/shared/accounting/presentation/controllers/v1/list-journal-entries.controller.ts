import { Request, Response } from "express";
import { listJournalEntries } from "../../../business/list-journal-entries.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listJournalEntriesQuerySchema } from "../../dto/requests/list-journal-entries-query.dto";
import { toJournalEntryResponse } from "../../dto/responses/journal-entry.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every other list endpoint in this module.
/** `GET /api/v1/accounting/journal-entries` — lists Journal Entries within the `X-Tenant-Id` tenant, optionally narrowed by `?companyUuid=`/`?status=`. */
export function listJournalEntriesController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listJournalEntriesQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const journalEntries = await listJournalEntries(
      { tenantId: header.data["x-tenant-id"], companyUuid: query.data.companyUuid, status: query.data.status },
      deps,
    );

    sendData(res, 200, journalEntries.map(toJournalEntryResponse));
  });
}
