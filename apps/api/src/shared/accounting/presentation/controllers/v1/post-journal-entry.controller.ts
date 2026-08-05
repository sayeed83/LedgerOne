import { Request, Response } from "express";
import { postJournalEntry } from "../../../business/post-journal-entry.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { journalEntryUuidParamSchema } from "../../dto/requests/journal-entry-uuid.schema";
import { toJournalEntryResponse } from "../../dto/responses/journal-entry.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/accounting/journal-entries/:journalEntryUuid/post` — 00_BUSINESS_RULES.md Ch.20.5: Draft/PendingApproval -> Posted. Balance (DBL-001), minimum-lines/distinct-accounts (DBL-002), and Fiscal-Period/Financial-Year-open (JRN-002/FY-003) are all re-validated, then one Ledger Entry per line is appended (LDG-001), inside one transaction. */
export function postJournalEntryController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = journalEntryUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const journalEntry = await postJournalEntry(
      { tenantId: header.data["x-tenant-id"], journalEntryUuid: params.data.journalEntryUuid },
      deps,
    );

    sendData(res, 200, toJournalEntryResponse(journalEntry));
  });
}
