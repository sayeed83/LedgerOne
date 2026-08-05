// Business layer — creates a new Draft Journal Entry (00_BUSINESS_RULES.md
// Ch.20.1/20.5). Resolves every line's Account by its external `accountUuid`
// first (mirroring create-account.service.ts resolving its Account Group) —
// never trusting a client-supplied internal `id` (06_DATABASE_STANDARDS.md
// PK-003) — and validates each via `validatePostingAccount` (Active,
// isPostingAccount).
//
// Enforces DBL-002 (minimum two lines, at least two distinct Accounts) and
// a structural per-line check (exactly one of `debitAmount`/`creditAmount`
// positive — 03_ARCHITECTURE.md Ch.7.3.6's `-debit: Money`/`-credit: Money`
// line shape) at creation time, since these do not depend on posting-time
// state. DBL-001's cross-line balance requirement is deliberately NOT
// checked here — Ch.16.6's workflow diagram frames the balance check as
// gating POSTING ("Entry may be Posted"), not Draft creation, and JRN-001
// says a Journal Entry "must satisfy the balance requirement before it can
// be Posted" (before posting, not before existing as a Draft) — a Draft is
// legitimately allowed to be work-in-progress and temporarily unbalanced.
// Balance is re-checked at posting time by validate-journal-entry-postable.service.ts.
// JRN-002's Fiscal-Period-open check is likewise deferred to posting time
// (Ch.20.7 ties it to posting, not Draft creation).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { IJournalEntryRepository } from "../domain/interfaces/journal-entry-repository.interface";
import { JournalEntry, CreateJournalEntryLineProps } from "../domain/aggregates/journal-entry.aggregate";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { validatePostingAccount } from "./validate-posting-account.service";
import { JournalEntryMinimumLinesError, JournalEntryMinimumDistinctAccountsError, InvalidJournalEntryLineAmountError } from "../domain/errors/accounting.errors";

export interface CreateJournalEntryLineInput {
  accountUuid: string;
  debitAmount: string;
  creditAmount: string;
}

export interface CreateJournalEntryInput {
  tenantId: bigint;
  companyUuid: string;
  postingDate: Date;
  narration?: string | null;
  lines: CreateJournalEntryLineInput[];
  createdBy?: bigint | null;
}

export interface CreateJournalEntryDeps {
  journalEntryRepository: IJournalEntryRepository;
  repository: IAccountingRepository;
}

export async function createJournalEntry(input: CreateJournalEntryInput, deps: CreateJournalEntryDeps): Promise<JournalEntry> {
  if (input.lines.length < 2) {
    throw new JournalEntryMinimumLinesError(input.lines.length);
  }

  const resolvedLines: CreateJournalEntryLineProps[] = [];
  for (const line of input.lines) {
    const account = await validatePostingAccount({ tenantId: input.tenantId, accountUuid: line.accountUuid }, deps);

    const debitAmount = DecimalValue.create(line.debitAmount);
    const creditAmount = DecimalValue.create(line.creditAmount);
    if (debitAmount.isPositive() === creditAmount.isPositive()) {
      throw new InvalidJournalEntryLineAmountError(debitAmount.toString(), creditAmount.toString());
    }

    resolvedLines.push({
      accountId: account.id,
      debitAmount,
      creditAmount,
      createdBy: input.createdBy ?? null,
    });
  }

  const distinctAccountCount = new Set(resolvedLines.map((line) => line.accountId.toString())).size;
  if (distinctAccountCount < 2) {
    throw new JournalEntryMinimumDistinctAccountsError(distinctAccountCount);
  }

  return deps.journalEntryRepository.createJournalEntry(input.tenantId, {
    companyUuid: input.companyUuid,
    postingDate: input.postingDate,
    narration: input.narration ?? null,
    lines: resolvedLines,
    createdBy: input.createdBy ?? null,
  });
}
