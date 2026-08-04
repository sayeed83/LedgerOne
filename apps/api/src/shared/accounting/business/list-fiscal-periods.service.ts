// Business layer — lists Fiscal Periods within a Tenant, optionally narrowed
// to a single Financial Year (00_BUSINESS_RULES.md Ch.6.1). `financialYearUuid`
// is resolved to its internal id first, mirroring create-fiscal-period.service.ts,
// since the Repository's `listFiscalPeriods` filters by the in-module
// `financialYearId`, never an externally-held `uuid` (06_DATABASE_STANDARDS.md PK-003).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FiscalPeriod } from "../domain/aggregates/fiscal-period.aggregate";
import { FinancialYearNotFoundError } from "../domain/errors/accounting.errors";

export interface ListFiscalPeriodsInput {
  tenantId: bigint;
  financialYearUuid?: string;
}

export interface ListFiscalPeriodsDeps {
  repository: IAccountingRepository;
}

export async function listFiscalPeriods(input: ListFiscalPeriodsInput, deps: ListFiscalPeriodsDeps): Promise<FiscalPeriod[]> {
  const { repository } = deps;

  if (!input.financialYearUuid) {
    return repository.listFiscalPeriods(input.tenantId);
  }

  const financialYear = await repository.findFinancialYearByUuid(input.tenantId, input.financialYearUuid);
  if (!financialYear) {
    throw new FinancialYearNotFoundError(input.financialYearUuid);
  }

  return repository.listFiscalPeriods(input.tenantId, financialYear.id);
}
