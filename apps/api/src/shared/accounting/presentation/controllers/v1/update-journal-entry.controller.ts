import { Request, Response } from "express";
import { updateJournalEntry } from "../../../business/update-journal-entry.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { journalEntryUuidParamSchema } from "../../dto/requests/journal-entry-uuid.schema";
import { updateJournalEntryRequestSchema } from "../../dto/requests/update-journal-entry.dto";
import { toJournalEntryResponse } from "../../dto/responses/journal-entry.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/accounting/journal-entries/:journalEntryUuid` — revises `postingDate`/`narration`; only a Draft entry is editable (00_BUSINESS_RULES.md Ch.20.5/JRN-003). */
export function updateJournalEntryController(deps: AccountingDependencies) {
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

    const body = updateJournalEntryRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const journalEntry = await updateJournalEntry(
      {
        tenantId: header.data["x-tenant-id"],
        journalEntryUuid: params.data.journalEntryUuid,
        postingDate: body.data.postingDate,
        narration: body.data.narration,
      },
      deps,
    );

    sendData(res, 200, toJournalEntryResponse(journalEntry));
  });
}
