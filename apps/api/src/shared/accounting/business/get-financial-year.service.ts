// Business layer — reads a Financial Year by its external identifier,
// scoped to the supplied Tenant (00_BUSINESS_RULES.md Ch.5.1). Never
// resolves by the internal `id` (06_DATABASE_STANDARDS.md PK-003) —
// callers outside this module only ever hold the `uuid`.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FinancialYear } from "../domain/aggregates/financial-year.aggregate";
import { FinancialYearNotFoundError } from "../domain/errors/accounting.errors";

export interface GetFinancialYearInput {
  tenantId: bigint;
  financialYearUuid: string;
}

export interface GetFinancialYearDeps {
  repository: IAccountingRepository;
}

export async function getFinancialYear(input: GetFinancialYearInput, deps: GetFinancialYearDeps): Promise<FinancialYear> {
  const financialYear = await deps.repository.findFinancialYearByUuid(input.tenantId, input.financialYearUuid);
  if (!financialYear) {
    throw new FinancialYearNotFoundError(input.financialYearUuid);
  }
  return financialYear;
}
