import { Request, Response } from "express";
import { createJournalEntry } from "../../../business/create-journal-entry.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createJournalEntryRequestSchema } from "../../dto/requests/create-journal-entry.dto";
import { toJournalEntryResponse } from "../../dto/responses/journal-entry.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/accounting/journal-entries` — creates a new Draft Journal Entry within a Company under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.20.1/20.5). */
export function createJournalEntryController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createJournalEntryRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const journalEntry = await createJournalEntry(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        postingDate: body.data.postingDate,
        narration: body.data.narration,
        lines: body.data.lines,
      },
      deps,
    );

    sendData(res, 201, toJournalEntryResponse(journalEntry));
  });
}
