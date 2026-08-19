import type { AccountType } from "./account-group.dto";
import type { FiscalPeriodStatus } from "./fiscal-period.dto";
import type { CursorPaginationMetaDto } from "./ledger.dto";

// Read-only derived data — no request DTOs beyond query filters, mirrors
// presentation/dto/responses/report-account.response.dto.ts and each
// individual report's own response.dto.ts (Trial Balance Ch.24, P&L Ch.25,
// Balance Sheet Ch.26, Cash Flow Ch.27, Financial Closing readiness Ch.32).

export interface ReportAccountDto {
  uuid: string;
  code: string;
  name: string;
  accountType: AccountType;
}

export interface ReportAccountBalanceDto {
  account: ReportAccountDto;
  totalDebit: string;
  totalCredit: string;
  balance: string;
}

export interface ReportGroupedBalanceNodeDto {
  accountGroupUuid: string;
  accountGroupName: string;
  accountBalances: ReportAccountBalanceDto[];
  children: ReportGroupedBalanceNodeDto[];
  subtotal: string;
}

export interface ReportSectionDto {
  groups: ReportGroupedBalanceNodeDto[];
  total: string;
}

// --- Trial Balance (Ch.24) ---

export interface TrialBalanceQueryDto {
  companyUuid: string;
  asOfDate?: string;
  fiscalPeriodUuid?: string;
  financialYearUuid?: string;
  includeZeroActivity?: boolean;
  cursor?: string;
  limit?: number;
}

export interface TrialBalanceResponseDto {
  asOfDate: string;
  isProvisional: boolean;
  rows: ReportAccountBalanceDto[];
  totalDebit: string;
  totalCredit: string;
  isBalanced: boolean;
}

export interface TrialBalanceEnvelopeDto {
  data: TrialBalanceResponseDto;
  meta: { pagination: CursorPaginationMetaDto };
}

// --- Balance Sheet (Ch.26) ---

export interface BalanceSheetQueryDto {
  companyUuid: string;
  asOfDate?: string;
  fiscalPeriodUuid?: string;
  financialYearUuid?: string;
}

export interface BalanceSheetResponseDto {
  asOfDate: string;
  isProvisional: boolean;
  assets: ReportSectionDto;
  liabilities: ReportSectionDto;
  equity: ReportSectionDto;
  currentYearEarnings: string;
  isBalanced: boolean;
}

// --- Profit & Loss (Ch.25) ---

export interface ProfitAndLossQueryDto {
  companyUuid: string;
  fiscalPeriodUuid?: string;
  financialYearUuid?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProfitAndLossResponseDto {
  periodStart: string;
  periodEnd: string;
  isProvisional: boolean;
  revenue: ReportSectionDto;
  expenses: ReportSectionDto;
  netProfit: string;
}

// --- Cash Flow (Ch.27) ---

export type CashFlowQueryDto = ProfitAndLossQueryDto;

export interface CashFlowResponseDto {
  periodStart: string;
  periodEnd: string;
  isProvisional: boolean;
  netProfit: string;
  operatingAdjustment: string;
  netCashFlow: string;
  actualCashChange: string;
  reconciles: boolean;
}

// --- Closing Readiness (Ch.32, read-only check — no closing action exists) ---

export interface ClosingReadinessQueryDto {
  companyUuid: string;
  fiscalPeriodUuid: string;
}

export interface ClosingReadinessResponseDto {
  fiscalPeriod: {
    uuid: string;
    startDate: string;
    endDate: string;
    status: FiscalPeriodStatus;
  };
  trialBalanceBalanced: boolean;
  priorPeriodsClosed: boolean;
  readyToClose: boolean;
  reasons: string[];
}
