// Business layer — the composite guard `postJournalEntry` calls before
// transitioning a Journal Entry to Posted. Bundles every posting-time
// precondition the handbook assigns to this moment specifically (as
// distinct from creation-time checks, already enforced by
// create-journal-entry.service.ts):
//
// - DBL-001 (balance) and DBL-002 (minimum lines / distinct accounts) are
//   re-checked here, not just at creation, because a Draft Journal Entry's
//   lines can change after creation (`addJournalEntryLine`/
//   `removeJournalEntryLine`, Repository-layer, persistence-only) — a Draft
//   that was valid at creation is not guaranteed to still be valid at the
//   moment of posting.
// - JRN-002 (Ch.20.7 — "posting date must fall within an Open Fiscal
//   Period") is resolved here by finding the Fiscal Period whose date range
//   contains `journalEntry.postingDate`, then delegating to the existing
//   `validateFiscalPeriodOpen` guard (built for exactly this call, per its
//   own doc comment: "the guard other modules' use cases (e.g. Journal
//   Entries, not built yet) call"). No `fiscalPeriodId` is stored on
//   `JournalEntry` (a frozen Database-layer decision — Fiscal Period is
//   derived from `postingDate`, never stored), so this resolution walks
//   `listFinancialYears` -> `listFiscalPeriods` using only the already-frozen
//   `IAccountingRepository` methods — no Repository interface change.
// - Ch.5's Financial Year-open check (FY-003) is likewise delegated to the
//   existing `validateFinancialYearOpen` guard, using the Financial Year
//   already resolved while searching for the matching Fiscal Period (no
//   second lookup needed).
//
// Explicitly NOT re-validated here: each line's referenced Account's
// Active/isPostingAccount status. `IAccountingRepository` (frozen, not
// modified this milestone) has no by-`id` Account lookup — only
// `findAccountByUuid`/`findAccountByCode` — and a `JournalEntryLine` loaded
// from `IJournalEntryRepository` carries only the Account's internal `id`
// (Ch.7.3.3's FK, never a `uuid` cross-reference on a child Entity). Without
// a Repository change (out of scope, frozen), there is no way to re-resolve
// an Account by `id` at this layer. This is flagged as a genuine
// architectural limitation (see the accompanying output's "Architectural
// Risks"), not silently worked around.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { JournalEntry, JournalEntryLine } from "../domain/aggregates/journal-entry.aggregate";
import { validateJournalEntryBalanced } from "./validate-journal-entry-balanced.service";
import { validateFiscalPeriodOpen } from "./validate-fiscal-period-open.service";
import { validateFinancialYearOpen } from "./validate-financial-year-open.service";
import {
  JournalEntryMinimumLinesError,
  JournalEntryMinimumDistinctAccountsError,
  NoFiscalPeriodForPostingDateError,
} from "../domain/errors/accounting.errors";

export interface ValidateJournalEntryPostableInput {
  tenantId: bigint;
  journalEntry: JournalEntry;
}

export interface ValidateJournalEntryPostableDeps {
  repository: IAccountingRepository;
}

export async function validateJournalEntryPostable(
  input: ValidateJournalEntryPostableInput,
  deps: ValidateJournalEntryPostableDeps,
): Promise<void> {
  const { journalEntry } = input;

  validateMinimumLinesAndAccounts(journalEntry.lines);
  validateJournalEntryBalanced(journalEntry.lines);

  const fiscalPeriod = await findFiscalPeriodForPostingDate(input.tenantId, journalEntry, deps.repository);
  await validateFinancialYearOpen(
    { tenantId: input.tenantId, financialYearUuid: fiscalPeriod.financialYearUuid },
    deps,
  );
  await validateFiscalPeriodOpen({ tenantId: input.tenantId, fiscalPeriodUuid: fiscalPeriod.uuid }, deps);
}

function validateMinimumLinesAndAccounts(lines: JournalEntryLine[]): void {
  if (lines.length < 2) {
    throw new JournalEntryMinimumLinesError(lines.length);
  }

  const distinctAccountCount = new Set(lines.map((line) => line.accountId.toString())).size;
  if (distinctAccountCount < 2) {
    throw new JournalEntryMinimumDistinctAccountsError(distinctAccountCount);
  }
}

async function findFiscalPeriodForPostingDate(
  tenantId: bigint,
  journalEntry: JournalEntry,
  repository: IAccountingRepository,
): Promise<{ uuid: string; financialYearUuid: string }> {
  const financialYears = await repository.listFinancialYears(tenantId, journalEntry.companyUuid);
  for (const financialYear of financialYears) {
    const fiscalPeriods = await repository.listFiscalPeriods(tenantId, financialYear.id);
    const match = fiscalPeriods.find(
      (period) => journalEntry.postingDate >= period.startDate && journalEntry.postingDate <= period.endDate,
    );
    if (match) {
      return { uuid: match.uuid, financialYearUuid: financialYear.uuid };
    }
  }
  throw new NoFiscalPeriodForPostingDateError(journalEntry.companyUuid, journalEntry.postingDate);
}
