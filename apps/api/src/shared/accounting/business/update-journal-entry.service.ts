// Business layer — revises `postingDate`/`narration` on an existing Journal
// Entry. Only a Draft entry is editable (00_BUSINESS_RULES.md Ch.20.5;
// JRN-003 — a Posted entry's correction path is a Reversing Entry, never a
// direct edit), enforced here since the Repository's `updateJournalEntry`
// is persistence-only and does not check status (mirrors
// close-fiscal-period.service.ts's pattern of the Business layer enforcing
// what a "raw persistence transition" Repository method does not).
import { IJournalEntryRepository } from "../domain/interfaces/journal-entry-repository.interface";
import { JournalEntry } from "../domain/aggregates/journal-entry.aggregate";
import { JournalEntryStatus } from "../domain/enums/journal-entry-status.enum";
import { JournalEntryNotFoundError, JournalEntryNotEditableError } from "../domain/errors/accounting.errors";

export interface UpdateJournalEntryInput {
  tenantId: bigint;
  journalEntryUuid: string;
  postingDate?: Date;
  narration?: string | null;
  updatedBy?: bigint | null;
}

export interface UpdateJournalEntryDeps {
  journalEntryRepository: IJournalEntryRepository;
}

export async function updateJournalEntry(input: UpdateJournalEntryInput, deps: UpdateJournalEntryDeps): Promise<JournalEntry> {
  const journalEntry = await deps.journalEntryRepository.findJournalEntryByUuid(input.tenantId, input.journalEntryUuid);
  if (!journalEntry) {
    throw new JournalEntryNotFoundError(input.journalEntryUuid);
  }

  if (journalEntry.status !== JournalEntryStatus.Draft) {
    throw new JournalEntryNotEditableError(journalEntry.uuid, journalEntry.status);
  }

  return deps.journalEntryRepository.updateJournalEntry(input.tenantId, input.journalEntryUuid, {
    postingDate: input.postingDate,
    narration: input.narration,
    updatedBy: input.updatedBy ?? null,
  });
}
