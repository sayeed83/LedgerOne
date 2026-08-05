// Business layer — transitions a Journal Entry from Draft to PendingApproval
// (00_BUSINESS_RULES.md Ch.20.5). The Domain aggregate's
// `submitForApproval()` enforces the transition is structurally legal
// (05_CODING_STANDARDS.md Ch.15.4) before this use case persists it,
// mirroring close-fiscal-period.service.ts's pattern.
//
// JRN-004's threshold decision ("is this entry actually above the
// Organization's configured approval threshold?") is explicitly NOT made
// here — no Approval Workflow module (Ch.13) exists anywhere in this
// codebase yet (confirmed in the earlier architecture review), so there is
// no threshold configuration to evaluate. This service only performs the
// state transition itself; the caller (a future Presentation-layer
// controller, or a future Posting Rule) decides WHETHER to call it.
import { IJournalEntryRepository } from "../domain/interfaces/journal-entry-repository.interface";
import { JournalEntry } from "../domain/aggregates/journal-entry.aggregate";
import { JournalEntryNotFoundError } from "../domain/errors/accounting.errors";

export interface SubmitJournalEntryForApprovalInput {
  tenantId: bigint;
  journalEntryUuid: string;
  updatedBy?: bigint | null;
}

export interface SubmitJournalEntryForApprovalDeps {
  journalEntryRepository: IJournalEntryRepository;
}

export async function submitJournalEntryForApproval(
  input: SubmitJournalEntryForApprovalInput,
  deps: SubmitJournalEntryForApprovalDeps,
): Promise<JournalEntry> {
  const journalEntry = await deps.journalEntryRepository.findJournalEntryByUuid(input.tenantId, input.journalEntryUuid);
  if (!journalEntry) {
    throw new JournalEntryNotFoundError(input.journalEntryUuid);
  }

  journalEntry.submitForApproval();
  return deps.journalEntryRepository.submitJournalEntryForApproval(input.tenantId, journalEntry.uuid, input.updatedBy ?? null);
}
