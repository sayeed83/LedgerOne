// Shared "account type grouping" filter — slices a flat Account list by one
// or more AccountTypes (Revenue+Expense for P&L Ch.25; Asset+Liability+Equity
// for Balance Sheet Ch.26). Not a `.service.ts` use case (no dependencies),
// mirroring `ledger-cursor.ts`'s own precedent for a small flat helper file.
import { Account } from "../../domain/aggregates/account.aggregate";
import { AccountType } from "../../domain/enums/account-type.enum";

export function filterAccountsByType(accounts: Account[], types: AccountType[]): Account[] {
  const allowed = new Set(types);
  return accounts.filter((account) => allowed.has(account.accountType));
}
