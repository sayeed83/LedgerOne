// Business layer — lists Journal Entries for a Tenant, optionally narrowed
// to a Company and/or lifecycle status, mirroring list-accounts.service.ts.
import { IJournalEntryRepository } from "../domain/interfaces/journal-entry-repository.interface";
import { JournalEntry } from "../domain/aggregates/journal-entry.aggregate";
import { JournalEntryStatus } from "../domain/enums/journal-entry-status.enum";

export interface ListJournalEntriesInput {
  tenantId: bigint;
  companyUuid?: string;
  status?: JournalEntryStatus;
}

export interface ListJournalEntriesDeps {
  journalEntryRepository: IJournalEntryRepository;
}

export async function listJournalEntries(input: ListJournalEntriesInput, deps: ListJournalEntriesDeps): Promise<JournalEntry[]> {
  return deps.journalEntryRepository.listJournalEntries(input.tenantId, input.companyUuid, input.status);
}
