// Business layer — defines a new Fiscal Period within a Financial Year
// (00_BUSINESS_RULES.md Ch.6.1). Resolves the parent Financial Year by its
// external `financialYearUuid` first (mirroring Organization's `createBranch`
// resolving its parent Company, and Authorization's `assignPermission`
// resolving its parent Role) — this both satisfies "a Fiscal Period belongs
// to exactly one Financial Year" and lets `companyUuid` be derived from the
// resolved parent rather than trusted as a separately-supplied input, so a
// Fiscal Period's Company can never drift from its own Financial Year's.
// The new date range must not overlap any existing Fiscal Period already
// registered within the same Financial Year (Ch.6 — periods subdivide their
// Financial Year without overlap), checked here since MySQL has no
// declarative way to express a date-range overlap constraint
// (apps/api/src/database/schema/accounting.prisma).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FiscalPeriod } from "../domain/aggregates/fiscal-period.aggregate";
import { FinancialYearNotFoundError, FiscalPeriodOverlapError } from "../domain/errors/accounting.errors";

export interface CreateFiscalPeriodInput {
  tenantId: bigint;
  financialYearUuid: string;
  startDate: Date;
  endDate: Date;
  createdBy?: bigint | null;
}

export interface CreateFiscalPeriodDeps {
  repository: IAccountingRepository;
}

export async function createFiscalPeriod(input: CreateFiscalPeriodInput, deps: CreateFiscalPeriodDeps): Promise<FiscalPeriod> {
  const { repository } = deps;

  const financialYear = await repository.findFinancialYearByUuid(input.tenantId, input.financialYearUuid);
  if (!financialYear) {
    throw new FinancialYearNotFoundError(input.financialYearUuid);
  }

  const existingPeriods = await repository.listFiscalPeriods(input.tenantId, financialYear.id);
  const overlaps = existingPeriods.some(
    (period) => input.startDate <= period.endDate && input.endDate >= period.startDate,
  );
  if (overlaps) {
    throw new FiscalPeriodOverlapError(financialYear.uuid, input.startDate, input.endDate);
  }

  return repository.createFiscalPeriod(input.tenantId, {
    companyUuid: financialYear.companyUuid,
    financialYearId: financialYear.id,
    startDate: input.startDate,
    endDate: input.endDate,
    createdBy: input.createdBy ?? null,
  });
}
