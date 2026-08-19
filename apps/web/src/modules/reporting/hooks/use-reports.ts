import { useQuery } from "@tanstack/react-query";
import type {
  BalanceSheetQueryDto,
  BalanceSheetResponseDto,
  CashFlowQueryDto,
  CashFlowResponseDto,
  ClosingReadinessQueryDto,
  ClosingReadinessResponseDto,
  ProfitAndLossQueryDto,
  ProfitAndLossResponseDto,
  TrialBalanceQueryDto,
} from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";
import type { TrialBalanceResult } from "@/services/accounting.service";
import type { ApiError } from "@/services/api-client";

// Read-only, derived-data hooks for the Financial Reporting engine
// (Trial Balance Ch.24, P&L Ch.25, Balance Sheet Ch.26, Cash Flow Ch.27,
// Financial Closing readiness check Ch.32) — mirrors `use-ledger.ts`'s own
// pattern (a query per report, `enabled` gated on the caller having
// resolved a valid scope, since every report requires at least
// `companyUuid`).

export function trialBalanceQueryKey(query: TrialBalanceQueryDto) {
  return ["reporting", "trial-balance", query] as const;
}

export function useTrialBalance(query: TrialBalanceQueryDto | null) {
  return useQuery<TrialBalanceResult, ApiError>({
    queryKey: trialBalanceQueryKey(query ?? { companyUuid: "" }),
    queryFn: () => accountingService.getTrialBalance(query as TrialBalanceQueryDto),
    enabled: Boolean(query?.companyUuid),
  });
}

export function balanceSheetQueryKey(query: BalanceSheetQueryDto) {
  return ["reporting", "balance-sheet", query] as const;
}

export function useBalanceSheet(query: BalanceSheetQueryDto | null) {
  return useQuery<BalanceSheetResponseDto, ApiError>({
    queryKey: balanceSheetQueryKey(query ?? { companyUuid: "" }),
    queryFn: () => accountingService.getBalanceSheet(query as BalanceSheetQueryDto),
    enabled: Boolean(query?.companyUuid),
  });
}

export function profitAndLossQueryKey(query: ProfitAndLossQueryDto) {
  return ["reporting", "profit-and-loss", query] as const;
}

// Ch.25/`ReportScopeRequiredError` (ACC_REPORT_SCOPE_REQUIRED): a P&L has no
// sensible default period — the caller must supply a Fiscal Period, a
// Financial Year, or an explicit `dateFrom`+`dateTo` pair before this query
// is enabled at all.
export function useProfitAndLoss(query: ProfitAndLossQueryDto | null) {
  return useQuery<ProfitAndLossResponseDto, ApiError>({
    queryKey: profitAndLossQueryKey(query ?? { companyUuid: "" }),
    queryFn: () => accountingService.getProfitAndLoss(query as ProfitAndLossQueryDto),
    enabled: Boolean(
      query?.companyUuid &&
        (query.fiscalPeriodUuid || query.financialYearUuid || (query.dateFrom && query.dateTo)),
    ),
  });
}

export function cashFlowQueryKey(query: CashFlowQueryDto) {
  return ["reporting", "cash-flow", query] as const;
}

// Same scope-required gating as Profit & Loss (Ch.27 shares the identical
// period-scope resolution, `resolvePeriodScope`, on the backend).
export function useCashFlow(query: CashFlowQueryDto | null) {
  return useQuery<CashFlowResponseDto, ApiError>({
    queryKey: cashFlowQueryKey(query ?? { companyUuid: "" }),
    queryFn: () => accountingService.getCashFlow(query as CashFlowQueryDto),
    enabled: Boolean(
      query?.companyUuid &&
        (query.fiscalPeriodUuid || query.financialYearUuid || (query.dateFrom && query.dateTo)),
    ),
  });
}

export function closingReadinessQueryKey(query: ClosingReadinessQueryDto) {
  return ["reporting", "closing-readiness", query] as const;
}

// Ch.32: `fiscalPeriodUuid` is required, not optional — this read-only check
// always names one specific Fiscal Period to evaluate.
export function useClosingReadiness(query: ClosingReadinessQueryDto | null) {
  return useQuery<ClosingReadinessResponseDto, ApiError>({
    queryKey: closingReadinessQueryKey(query ?? { companyUuid: "", fiscalPeriodUuid: "" }),
    queryFn: () => accountingService.getClosingReadiness(query as ClosingReadinessQueryDto),
    enabled: Boolean(query?.companyUuid && query?.fiscalPeriodUuid),
  });
}
