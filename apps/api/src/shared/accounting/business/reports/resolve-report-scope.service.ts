// Shared "date filtering, Financial Year filtering, Fiscal Period filtering"
// primitive for the Financial Reporting engine — every report resolves its
// scope through exactly one of these two functions rather than each
// re-implementing Fiscal Period/Financial Year lookup and provisional-status
// labeling (00_BUSINESS_RULES.md Ch.81.8 FRP validation).
import { IAccountingRepository } from "../../domain/interfaces/accounting-repository.interface";
import { IClock } from "../../domain/interfaces/clock.interface";
import { FiscalPeriodStatus } from "../../domain/enums/fiscal-period-status.enum";
import { FinancialYearStatus } from "../../domain/enums/financial-year-status.enum";
import { FiscalPeriodNotFoundError, FinancialYearNotFoundError, ReportScopeRequiredError, InvalidReportDateRangeError } from "../../domain/errors/accounting.errors";
import { PointInTimeScope, PeriodScope } from "./reporting-types";

export interface PointInTimeScopeInput {
  tenantId: bigint;
  asOfDate?: Date;
  fiscalPeriodUuid?: string;
  financialYearUuid?: string;
}

/**
 * Resolves a point-in-time report's (Trial Balance Ch.24, Balance Sheet
 * Ch.26) `asOfDate`. A `fiscalPeriodUuid`/`financialYearUuid` resolves to
 * that period/year's own `endDate` and its Closed-status-derived
 * `isProvisional`; an explicit `asOfDate` (or none at all, defaulting to
 * "now") is always treated as provisional — without a period/year
 * reference there is no positively-confirmed Closed status to report
 * against (a deliberate, documented simplification, not a guess).
 */
export async function resolvePointInTimeScope(
  input: PointInTimeScopeInput,
  repository: IAccountingRepository,
  clock: IClock,
): Promise<PointInTimeScope> {
  if (input.fiscalPeriodUuid) {
    const period = await repository.findFiscalPeriodByUuid(input.tenantId, input.fiscalPeriodUuid);
    if (!period) {
      throw new FiscalPeriodNotFoundError(input.fiscalPeriodUuid);
    }
    return { asOfDate: period.endDate, isProvisional: period.status !== FiscalPeriodStatus.Closed };
  }
  if (input.financialYearUuid) {
    const year = await repository.findFinancialYearByUuid(input.tenantId, input.financialYearUuid);
    if (!year) {
      throw new FinancialYearNotFoundError(input.financialYearUuid);
    }
    return { asOfDate: year.endDate, isProvisional: year.status !== FinancialYearStatus.Closed };
  }
  return { asOfDate: input.asOfDate ?? clock.now(), isProvisional: true };
}

export interface PeriodScopeInput {
  tenantId: bigint;
  fiscalPeriodUuid?: string;
  financialYearUuid?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Resolves a period-window report's (Profit & Loss Ch.25, Cash Flow Ch.27)
 * `[periodStart, periodEnd]`. Unlike `resolvePointInTimeScope`, there is no
 * sensible "now"-based default — a P&L/Cash Flow always covers a specific
 * period, never an instant — so at least one of `fiscalPeriodUuid`,
 * `financialYearUuid`, or an explicit `dateFrom`+`dateTo` pair is required;
 * omitting all three throws `ReportScopeRequiredError`.
 */
export async function resolvePeriodScope(input: PeriodScopeInput, repository: IAccountingRepository): Promise<PeriodScope> {
  if (input.fiscalPeriodUuid) {
    const period = await repository.findFiscalPeriodByUuid(input.tenantId, input.fiscalPeriodUuid);
    if (!period) {
      throw new FiscalPeriodNotFoundError(input.fiscalPeriodUuid);
    }
    return { periodStart: period.startDate, periodEnd: period.endDate, isProvisional: period.status !== FiscalPeriodStatus.Closed };
  }
  if (input.financialYearUuid) {
    const year = await repository.findFinancialYearByUuid(input.tenantId, input.financialYearUuid);
    if (!year) {
      throw new FinancialYearNotFoundError(input.financialYearUuid);
    }
    return { periodStart: year.startDate, periodEnd: year.endDate, isProvisional: year.status !== FinancialYearStatus.Closed };
  }
  if (input.dateFrom && input.dateTo) {
    if (input.dateFrom.getTime() > input.dateTo.getTime()) {
      throw new InvalidReportDateRangeError(input.dateFrom, input.dateTo);
    }
    return { periodStart: input.dateFrom, periodEnd: input.dateTo, isProvisional: true };
  }
  throw new ReportScopeRequiredError();
}
