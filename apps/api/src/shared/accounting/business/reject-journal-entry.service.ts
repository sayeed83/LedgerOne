// Business layer — transitions a Journal Entry from PendingApproval back to
// Draft (00_BUSINESS_RULES.md Ch.13.5/Ch.20.5, APR-003 — "a Rejected
// transaction returns to Draft/editable state for the original submitter
// to correct and resubmit — it does not proceed and does not require a new
// transaction to be created"). The Domain aggregate's `reject()` enforces
// the transition is structurally legal before this use case persists it.
//
// APR-002's segregation-of-duties requirement ("an approver may never be
// the same User who submitted the transaction") is not enforced here — no
// Approval Workflow module exists to track who submitted/approves, so there
// is no submitter identity to compare against (the same gap already
// documented for submit-journal-entry-for-approval.service.ts).
import { IJournalEntryRepository } from "../domain/interfaces/journal-entry-repository.interface";
import { JournalEntry } from "../domain/aggregates/journal-entry.aggregate";
import { JournalEntryNotFoundError } from "../domain/errors/accounting.errors";

export interface RejectJournalEntryInput {
  tenantId: bigint;
  journalEntryUuid: string;
  updatedBy?: bigint | null;
}

export interface RejectJournalEntryDeps {
  journalEntryRepository: IJournalEntryRepository;
}

export async function rejectJournalEntry(input: RejectJournalEntryInput, deps: RejectJournalEntryDeps): Promise<JournalEntry> {
  const journalEntry = await deps.journalEntryRepository.findJournalEntryByUuid(input.tenantId, input.journalEntryUuid);
  if (!journalEntry) {
    throw new JournalEntryNotFoundError(input.journalEntryUuid);
  }

  journalEntry.reject();
  return deps.journalEntryRepository.rejectJournalEntry(input.tenantId, journalEntry.uuid, input.updatedBy ?? null);
}
