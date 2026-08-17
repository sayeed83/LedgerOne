import { z } from "zod";
import { toReportGroupedBalanceNode } from "./report-account.response.dto";

// Profit & Loss (00_BUSINESS_RULES.md Ch.25). Recursive Account Group tree —
// `z.lazy` is required for Zod to type a self-referential schema.
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

const profitAndLossSectionSchema = z.object({
  groups: z.array(groupedBalanceNodeSchema),
  total: z.string(),
});

export const profitAndLossResponseSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  isProvisional: z.boolean(),
  revenue: profitAndLossSectionSchema,
  expenses: profitAndLossSectionSchema,
  netProfit: z.string(),
});

export type ProfitAndLossResponse = z.infer<typeof profitAndLossResponseSchema>;

interface ProfitAndLossSectionLike {
  groups: Parameters<typeof toReportGroupedBalanceNode>[0][];
  total: { toString(): string };
}

interface ProfitAndLossResultLike {
  periodStart: Date;
  periodEnd: Date;
  isProvisional: boolean;
  revenue: ProfitAndLossSectionLike;
  expenses: ProfitAndLossSectionLike;
  netProfit: { toString(): string };
}

export function toProfitAndLossResponse(result: ProfitAndLossResultLike): ProfitAndLossResponse {
  return {
    periodStart: result.periodStart.toISOString(),
    periodEnd: result.periodEnd.toISOString(),
    isProvisional: result.isProvisional,
    revenue: { groups: result.revenue.groups.map(toReportGroupedBalanceNode), total: result.revenue.total.toString() },
    expenses: { groups: result.expenses.groups.map(toReportGroupedBalanceNode), total: result.expenses.total.toString() },
    netProfit: result.netProfit.toString(),
  };
}
