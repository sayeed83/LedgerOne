// Shared types for the Financial Reporting engine (Trial Balance Ch.24, P&L
// Ch.25, Balance Sheet Ch.26, Cash Flow Ch.27, Closing-Readiness Ch.32) — not
// a `.service.ts` use case itself, mirroring `accounting-types.ts`'s own
// precedent for a flat, non-use-case business file.
import { Account } from "../../domain/aggregates/account.aggregate";
import { AccountGroup } from "../../domain/entities/account-group.entity";
import { DecimalValue } from "../../domain/value-objects/decimal-value.value-object";

/** One Account's aggregated debit/credit totals and signed net balance over a report's date range — the shared engine's core computed unit, produced by `aggregate-account-balances.service.ts` and consumed by every report. */
export interface AccountBalance {
  account: Account;
  totalDebit: DecimalValue;
  totalCredit: DecimalValue;
  /** Signed in the Account's own normal-balance direction (Ch.16 DBL-003), via the existing, unmodified `netBalance` primitive. */
  balance: DecimalValue;
}

/** A node in the Account Group hierarchy tree, rolled up bottom-up with its own Accounts' balances plus every descendant subtotal — produced by `group-balances-by-account-group.service.ts`. */
export interface GroupedBalanceNode {
  accountGroup: AccountGroup;
  children: GroupedBalanceNode[];
  accountBalances: AccountBalance[];
  /** Sum of `accountBalances` plus every descendant node's own `subtotal`. */
  subtotal: DecimalValue;
}

/** A resolved point-in-time report scope (Trial Balance, Balance Sheet) — produced by `resolvePointInTimeScope`. */
export interface PointInTimeScope {
  asOfDate: Date;
  /** True when the resolved Fiscal Period/Financial Year is not Closed, or when no period reference was supplied at all (Ch.81.8 — a report covering a still-Open period must be labeled provisional/unaudited). */
  isProvisional: boolean;
}

/** A resolved period-window report scope (P&L, Cash Flow) — produced by `resolvePeriodScope`. */
export interface PeriodScope {
  periodStart: Date;
  periodEnd: Date;
  isProvisional: boolean;
}
