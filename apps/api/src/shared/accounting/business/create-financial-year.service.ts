// Business layer — defines a new Financial Year for a Company
// (00_BUSINESS_RULES.md Ch.5.1). The new date range must not overlap any
// existing Financial Year already registered for the same Company (Ch.5.7
// FY-002, Ch.5.8 Validation Rules) — checked here rather than left
// unenforced, since MySQL has no declarative way to express a date-range
// overlap constraint (apps/api/src/database/schema/accounting.prisma).
// `companyUuid` is a cross-module reference (FK-002) to Organization's
// `companies.uuid`; its existence is not validated here, mirroring User
// Management's create-user.service.ts, which likewise never validates its
// own cross-module `companyUuid` against Organization.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FinancialYear } from "../domain/aggregates/financial-year.aggregate";
import { FinancialYearOverlapError } from "../domain/errors/accounting.errors";

export interface CreateFinancialYearInput {
  tenantId: bigint;
  companyUuid: string;
  startDate: Date;
  endDate: Date;
  createdBy?: bigint | null;
}

export interface CreateFinancialYearDeps {
  repository: IAccountingRepository;
}

export async function createFinancialYear(input: CreateFinancialYearInput, deps: CreateFinancialYearDeps): Promise<FinancialYear> {
  const { repository } = deps;

  const existingYears = await repository.listFinancialYears(input.tenantId, input.companyUuid);
  const overlaps = existingYears.some(
    (year) => input.startDate <= year.endDate && input.endDate >= year.startDate,
  );
  if (overlaps) {
    throw new FinancialYearOverlapError(input.companyUuid, input.startDate, input.endDate);
  }

  return repository.createFinancialYear(input.tenantId, {
    companyUuid: input.companyUuid,
    startDate: input.startDate,
    endDate: input.endDate,
    createdBy: input.createdBy ?? null,
  });
}
