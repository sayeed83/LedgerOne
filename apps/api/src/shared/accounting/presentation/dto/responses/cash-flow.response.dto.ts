import { z } from "zod";

// Cash Flow (00_BUSINESS_RULES.md Ch.27), simplified indirect method — see
// `get-cash-flow.service.ts`'s own header comment for why this is one
// reconciling "Operating Activities" figure rather than a genuine
// Operating/Investing/Financing three-way split (a documented Architectural
// Risk, not an oversight).
export const cashFlowResponseSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  isProvisional: z.boolean(),
  netProfit: z.string(),
  operatingAdjustment: z.string(),
  netCashFlow: z.string(),
  actualCashChange: z.string(),
  reconciles: z.boolean(),
});

export type CashFlowResponse = z.infer<typeof cashFlowResponseSchema>;

interface CashFlowResultLike {
  periodStart: Date;
  periodEnd: Date;
  isProvisional: boolean;
  netProfit: { toString(): string };
  operatingAdjustment: { toString(): string };
  netCashFlow: { toString(): string };
  actualCashChange: { toString(): string };
  reconciles: boolean;
}

export function toCashFlowResponse(result: CashFlowResultLike): CashFlowResponse {
  return {
    periodStart: result.periodStart.toISOString(),
    periodEnd: result.periodEnd.toISOString(),
    isProvisional: result.isProvisional,
    netProfit: result.netProfit.toString(),
    operatingAdjustment: result.operatingAdjustment.toString(),
    netCashFlow: result.netCashFlow.toString(),
    actualCashChange: result.actualCashChange.toString(),
    reconciles: result.reconciles,
  };
}
