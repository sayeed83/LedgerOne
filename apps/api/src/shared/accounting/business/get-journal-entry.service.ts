// Business layer — resolves a single Journal Entry by its external `uuid`
// (06_DATABASE_STANDARDS.md PK-003), mirroring get-account.service.ts.
import { IJournalEntryRepository } from "../domain/interfaces/journal-entry-repository.interface";
import { JournalEntry } from "../domain/aggregates/journal-entry.aggregate";
import { JournalEntryNotFoundError } from "../domain/errors/accounting.errors";

export interface GetJournalEntryInput {
  tenantId: bigint;
  journalEntryUuid: string;
}

export interface GetJournalEntryDeps {
  journalEntryRepository: IJournalEntryRepository;
}

export async function getJournalEntry(input: GetJournalEntryInput, deps: GetJournalEntryDeps): Promise<JournalEntry> {
  const journalEntry = await deps.journalEntryRepository.findJournalEntryByUuid(input.tenantId, input.journalEntryUuid);
  if (!journalEntry) {
    throw new JournalEntryNotFoundError(input.journalEntryUuid);
  }
  return journalEntry;
}
