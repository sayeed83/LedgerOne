import { z } from "zod";
import { AccountType } from "../../../business/accounting-types";

// Shared narrow Account shape for the Financial Reporting engine's response
// DTOs — mirrors `account-ledger.response.dto.ts`'s own `account` field
// exactly (uuid/code/name/accountType only, never internal `id`/`tenantId`,
// PK-003). One place so Trial Balance/P&L/Balance Sheet don't each redefine
// the same four fields.
export const reportAccountSchema = z.object({
  uuid: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  accountType: z.nativeEnum(AccountType),
});

export type ReportAccountResponse = z.infer<typeof reportAccountSchema>;

interface AccountLike {
  uuid: string;
  code: string;
  name: string;
  accountType: AccountType;
}

export function toReportAccount(account: AccountLike): ReportAccountResponse {
  return { uuid: account.uuid, code: account.code, name: account.name, accountType: account.accountType };
}

// Shared "one Account's aggregated balance" row shape, reused by every
// report's row/line-item mapping.
export const reportAccountBalanceSchema = z.object({
  account: reportAccountSchema,
  totalDebit: z.string(),
  totalCredit: z.string(),
  balance: z.string(),
});

export type ReportAccountBalanceResponse = z.infer<typeof reportAccountBalanceSchema>;

interface AccountBalanceLike {
  account: AccountLike;
  totalDebit: { toString(): string };
  totalCredit: { toString(): string };
  balance: { toString(): string };
}

export function toReportAccountBalance(balance: AccountBalanceLike): ReportAccountBalanceResponse {
  return {
    account: toReportAccount(balance.account),
    totalDebit: balance.totalDebit.toString(),
    totalCredit: balance.totalCredit.toString(),
    balance: balance.balance.toString(),
  };
}

// Shared Account Group hierarchy node shape, reused by P&L/Balance Sheet's
// grouped sections.
export interface ReportGroupedBalanceNodeResponse {
  accountGroupUuid: string;
  accountGroupName: string;
  accountBalances: ReportAccountBalanceResponse[];
  children: ReportGroupedBalanceNodeResponse[];
  subtotal: string;
}

interface GroupedBalanceNodeLike {
  accountGroup: { uuid: string; name: string };
  accountBalances: AccountBalanceLike[];
  children: GroupedBalanceNodeLike[];
  subtotal: { toString(): string };
}

export function toReportGroupedBalanceNode(node: GroupedBalanceNodeLike): ReportGroupedBalanceNodeResponse {
  return {
    accountGroupUuid: node.accountGroup.uuid,
    accountGroupName: node.accountGroup.name,
    accountBalances: node.accountBalances.map(toReportAccountBalance),
    children: node.children.map(toReportGroupedBalanceNode),
    subtotal: node.subtotal.toString(),
  };
}
