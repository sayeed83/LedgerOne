import { z } from "zod";
import { toReportGroupedBalanceNode } from "./report-account.response.dto";

const groupedBalanceNodeSchema: z.ZodType<{
  accountGroupUuid: string;
  accountGroupName: string;
  accountBalances: unknown[];
  children: unknown[];
  subtotal: string;
}> = z.lazy(() =>
  z.object({
    accountGroupUuid: z.string().uuid(),
    accountGroupName: z.string(),
    accountBalances: z.array(
      z.object({
        account: z.object({ uuid: z.string().uuid(), code: z.string(), name: z.string(), accountType: z.string() }),
        totalDebit: z.string(),
        totalCredit: z.string(),
        balance: z.string(),
      }),
    ),
    children: z.array(groupedBalanceNodeSchema),
    subtotal: z.string(),
  }),
);

const balanceSheetSectionSchema = z.object({
  groups: z.array(groupedBalanceNodeSchema),
  total: z.string(),
});

// Balance Sheet (00_BUSINESS_RULES.md Ch.26). `isBalanced` is BAL-001's
// check surfaced as data, never thrown. `equity.total` already includes
// `currentYearEarnings` (BAL-002) — also returned standalone for
// transparency about where that figure came from.
export const balanceSheetResponseSchema = z.object({
  asOfDate: z.string(),
  isProvisional: z.boolean(),
  assets: balanceSheetSectionSchema,
  liabilities: balanceSheetSectionSchema,
  equity: balanceSheetSectionSchema,
  currentYearEarnings: z.string(),
  isBalanced: z.boolean(),
});

export type BalanceSheetResponse = z.infer<typeof balanceSheetResponseSchema>;

interface BalanceSheetSectionLike {
  groups: Parameters<typeof toReportGroupedBalanceNode>[0][];
  total: { toString(): string };
}

interface BalanceSheetResultLike {
  asOfDate: Date;
  isProvisional: boolean;
  assets: BalanceSheetSectionLike;
  liabilities: BalanceSheetSectionLike;
  equity: BalanceSheetSectionLike;
  currentYearEarnings: { toString(): string };
  isBalanced: boolean;
}

export function toBalanceSheetResponse(result: BalanceSheetResultLike): BalanceSheetResponse {
  const toSection = (section: BalanceSheetSectionLike) => ({ groups: section.groups.map(toReportGroupedBalanceNode), total: section.total.toString() });
  return {
    asOfDate: result.asOfDate.toISOString(),
    isProvisional: result.isProvisional,
    assets: toSection(result.assets),
    liabilities: toSection(result.liabilities),
    equity: toSection(result.equity),
    currentYearEarnings: result.currentYearEarnings.toString(),
    isBalanced: result.isBalanced,
  };
}
