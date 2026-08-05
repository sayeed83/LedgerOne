import { Request, Response } from "express";
import { reverseJournalEntry } from "../../../business/reverse-journal-entry.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { journalEntryUuidParamSchema } from "../../dto/requests/journal-entry-uuid.schema";
import { toJournalEntryResponse } from "../../dto/responses/journal-entry.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/accounting/journal-entries/:journalEntryUuid/reverse` — 00_BUSINESS_RULES.md Ch.20.7 JRN-003: only a Posted entry may be reversed. Creates and posts a new Journal Entry with inverted debits/credits referencing the original, then marks the original Reversed. Returns the new REVERSING entry, not the original. */
export function reverseJournalEntryController(deps: AccountingDependencies) {
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

    const reversingEntry = await reverseJournalEntry(
      { tenantId: header.data["x-tenant-id"], journalEntryUuid: params.data.journalEntryUuid },
      deps,
    );

    sendData(res, 201, toJournalEntryResponse(reversingEntry));
  });
}
