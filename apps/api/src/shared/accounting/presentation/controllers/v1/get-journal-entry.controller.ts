import { Request, Response } from "express";
import { getJournalEntry } from "../../../business/get-journal-entry.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { journalEntryUuidParamSchema } from "../../dto/requests/journal-entry-uuid.schema";
import { toJournalEntryResponse } from "../../dto/responses/journal-entry.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/accounting/journal-entries/:journalEntryUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getJournalEntryController(deps: AccountingDependencies) {
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

    const journalEntry = await getJournalEntry(
      { tenantId: header.data["x-tenant-id"], journalEntryUuid: params.data.journalEntryUuid },
      deps,
    );

    sendData(res, 200, toJournalEntryResponse(journalEntry));
  });
}
