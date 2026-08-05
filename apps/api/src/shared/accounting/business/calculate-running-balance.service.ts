// Business layer — 00_BUSINESS_RULES.md Ch.19.7 LDG-003: "An account's
// Ledger running balance must always equal the sum of all its Ledger
// entries to date" — computed here, at query time, on every read; NEVER
// stored (see `ledger-repository.interface.ts`'s own doc comment on why
// `LedgerEntry` carries no `runningBalance` column — a stored value could
// drift from the entries LDG-003 says it must equal).
//
// `netBalance` is the shared normal-balance primitive (00_BUSINESS_RULES.md
// Ch.16 DBL-003: "Increasing an Asset or Expense account is recorded as a
// Debit; increasing a Liability, Equity, or Revenue account is recorded as
// a Credit... and vice versa for decreases") every future account-balance
// report will need identically — Trial Balance (Ch.24.10, "a derived report
// over Ledger data"), Profit & Loss (Ch.25), Balance Sheet (Ch.26). Built
// once here, as this milestone's own architecture review's "Shared
// Reporting Logic" recommended, not reimplemented per report.
import { AccountType } from "../domain/enums/account-type.enum";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { LedgerEntry } from "../domain/entities/ledger-entry.entity";

const DEBIT_NORMAL_TYPES: ReadonlySet<AccountType> = new Set([AccountType.Asset, AccountType.Expense]);

/** True for Asset/Expense (Ch.16 DBL-003 — a Debit increases these); false for Liability/Equity/Revenue (a Credit increases these). */
export function isDebitNormal(accountType: AccountType): boolean {
  return DEBIT_NORMAL_TYPES.has(accountType);
}

/** Signs a raw debit/credit total pair into one balance figure in the Account's own normal-balance direction (Ch.16 DBL-003). */
export function netBalance(accountType: AccountType, totalDebit: DecimalValue, totalCredit: DecimalValue): DecimalValue {
  return isDebitNormal(accountType) ? totalDebit.subtract(totalCredit) : totalCredit.subtract(totalDebit);
}

export interface LedgerEntryWithBalance {
  entry: LedgerEntry;
  runningBalance: DecimalValue;
}

export interface RunningBalanceResult {
  entries: LedgerEntryWithBalance[];
  closingBalance: DecimalValue;
}

/**
 * Walks a chronologically-ordered page of Ledger Entries, carrying
 * `openingBalance` forward one entry at a time (LDG-003). `entries` MUST
 * already be ordered `entryDate` ascending with the `uuid` tie-breaker
 * (`ILedgerRepository.listLedgerEntries`'s own documented ordering) — this
 * function trusts that ordering rather than re-sorting it, since re-sorting
 * here would silently mask a Repository-layer ordering bug instead of
 * surfacing it.
 */
export function calculateRunningBalance(
  accountType: AccountType,
  openingBalance: DecimalValue,
  entries: LedgerEntry[],
): RunningBalanceResult {
  let running = openingBalance;
  const withBalance: LedgerEntryWithBalance[] = entries.map((entry) => {
    running = running.add(netBalance(accountType, entry.debitAmount, entry.creditAmount));
    return { entry, runningBalance: running };
  });
  return { entries: withBalance, closingBalance: running };
}
