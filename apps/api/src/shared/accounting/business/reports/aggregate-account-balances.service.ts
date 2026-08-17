// Shared "opening/closing balance, debit totals, credit totals, net
// balance, account aggregation" primitive for the Financial Reporting
// engine — every report (Trial Balance Ch.24, P&L Ch.25, Balance Sheet
// Ch.26, Cash Flow Ch.27) calls this exact function rather than
// re-implementing per-account Ledger aggregation. Built on the existing,
// unmodified `netBalance`/`isDebitNormal` (`calculate-running-balance.service.ts`)
// and the new batched `ILedgerRepository.sumLedgerEntriesByAccounts`.
import { Account } from "../../domain/aggregates/account.aggregate";
import { DecimalValue } from "../../domain/value-objects/decimal-value.value-object";
import { ILedgerRepository } from "../../domain/interfaces/ledger-repository.interface";
import { netBalance } from "../calculate-running-balance.service";
import { AccountBalance } from "./reporting-types";

export interface AggregateAccountBalancesDateRange {
  /** Omitted sums from account inception. */
  dateFrom?: Date;
  /** The report's point-in-time boundary or period end — always supplied. */
  dateTo: Date;
}

const ZERO = DecimalValue.create("0");

export async function aggregateAccountBalances(
  tenantId: bigint,
  companyUuid: string,
  accounts: Account[],
  dateRange: AggregateAccountBalancesDateRange,
  ledgerRepository: ILedgerRepository,
): Promise<AccountBalance[]> {
  if (accounts.length === 0) {
    return [];
  }
  const sums = await ledgerRepository.sumLedgerEntriesByAccounts(
    tenantId,
    companyUuid,
    accounts.map((account) => account.id),
    dateRange.dateFrom,
    dateRange.dateTo,
  );
  return accounts.map((account) => {
    const sum = sums.get(account.id);
    const totalDebit = sum ? DecimalValue.create(sum.totalDebit) : ZERO;
    const totalCredit = sum ? DecimalValue.create(sum.totalCredit) : ZERO;
    return { account, totalDebit, totalCredit, balance: netBalance(account.accountType, totalDebit, totalCredit) };
  });
}

/** Sums a list of `AccountBalance.balance` values — the shared "total this section/report" reducer every report otherwise repeats inline. */
export function sumBalances(balances: AccountBalance[]): DecimalValue {
  return balances.reduce((total, item) => total.add(item.balance), ZERO);
}
