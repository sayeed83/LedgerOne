import { z } from "zod";
import { reportAccountBalanceSchema, toReportAccountBalance } from "./report-account.response.dto";

// Trial Balance (00_BUSINESS_RULES.md Ch.24). `isProvisional` per Ch.81.8 —
// true whenever the resolved Fiscal Period/Financial Year is not Closed (or
// no period reference was supplied at all). `isBalanced` is TRB-001's
// balance check surfaced as data, never a thrown error (this is a read-only
// report).
export const trialBalanceResponseSchema = z.object({
  asOfDate: z.string(),
  isProvisional: z.boolean(),
  rows: z.array(reportAccountBalanceSchema),
  totalDebit: z.string(),
  totalCredit: z.string(),
  isBalanced: z.boolean(),
});

export type TrialBalanceResponse = z.infer<typeof trialBalanceResponseSchema>;

export const trialBalancePaginationMetaSchema = z.object({
  pagination: z.object({
    limit: z.number(),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

export type TrialBalancePaginationMeta = z.infer<typeof trialBalancePaginationMetaSchema>;

interface TrialBalanceResultLike {
  asOfDate: Date;
  isProvisional: boolean;
  rows: Parameters<typeof toReportAccountBalance>[0][];
  totalDebit: { toString(): string };
  totalCredit: { toString(): string };
  isBalanced: boolean;
  pagination: { limit: number; nextCursor: string | null; hasMore: boolean };
}

export function toTrialBalanceResponse(result: TrialBalanceResultLike): TrialBalanceResponse {
  return {
    asOfDate: result.asOfDate.toISOString(),
    isProvisional: result.isProvisional,
    rows: result.rows.map(toReportAccountBalance),
    totalDebit: result.totalDebit.toString(),
    totalCredit: result.totalCredit.toString(),
    isBalanced: result.isBalanced,
  };
}

export function toTrialBalancePaginationMeta(result: TrialBalanceResultLike): TrialBalancePaginationMeta {
  return { pagination: result.pagination };
}
