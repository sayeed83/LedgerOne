// Business layer — transitions a Financial Year to Open
// (00_BUSINESS_RULES.md Ch.5.5): valid only from Future. The Domain
// aggregate's `open()` enforces the transition is legal
// (05_CODING_STANDARDS.md Ch.15.4) before this use case persists it.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FinancialYear } from "../domain/aggregates/financial-year.aggregate";
import { FinancialYearNotFoundError } from "../domain/errors/accounting.errors";

export interface OpenFinancialYearInput {
  tenantId: bigint;
  financialYearUuid: string;
  updatedBy?: bigint | null;
}

export interface OpenFinancialYearDeps {
  repository: IAccountingRepository;
}

export async function openFinancialYear(input: OpenFinancialYearInput, deps: OpenFinancialYearDeps): Promise<FinancialYear> {
  const { repository } = deps;

  const financialYear = await repository.findFinancialYearByUuid(input.tenantId, input.financialYearUuid);
  if (!financialYear) {
    throw new FinancialYearNotFoundError(input.financialYearUuid);
  }

  financialYear.open();
  return repository.openFinancialYear(input.tenantId, financialYear.uuid, input.updatedBy ?? null);
}
