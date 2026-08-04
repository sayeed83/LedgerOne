// Business layer — lists Financial Years within a Tenant, optionally
// narrowed to a single Company (00_BUSINESS_RULES.md Ch.5.1).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FinancialYear } from "../domain/aggregates/financial-year.aggregate";

export interface ListFinancialYearsInput {
  tenantId: bigint;
  companyUuid?: string;
}

export interface ListFinancialYearsDeps {
  repository: IAccountingRepository;
}

export async function listFinancialYears(input: ListFinancialYearsInput, deps: ListFinancialYearsDeps): Promise<FinancialYear[]> {
  return deps.repository.listFinancialYears(input.tenantId, input.companyUuid);
}
