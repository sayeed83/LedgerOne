// Business layer — transitions a Financial Year to Closed
// (00_BUSINESS_RULES.md Ch.5.5): valid only from Open, Closing, or
// Reopened. The Domain aggregate's `close()` enforces the transition is
// legal (05_CODING_STANDARDS.md Ch.15.4) before this use case persists it.
// The Financial Closing process itself (Ch.32 — closing entries, approval
// workflow) is out of scope; this use case only records the resulting
// state change.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FinancialYear } from "../domain/aggregates/financial-year.aggregate";
import { FinancialYearNotFoundError } from "../domain/errors/accounting.errors";

export interface CloseFinancialYearInput {
  tenantId: bigint;
  financialYearUuid: string;
  updatedBy?: bigint | null;
}

export interface CloseFinancialYearDeps {
  repository: IAccountingRepository;
}

export async function closeFinancialYear(input: CloseFinancialYearInput, deps: CloseFinancialYearDeps): Promise<FinancialYear> {
  const { repository } = deps;

  const financialYear = await repository.findFinancialYearByUuid(input.tenantId, input.financialYearUuid);
  if (!financialYear) {
    throw new FinancialYearNotFoundError(input.financialYearUuid);
  }

  financialYear.close();
  return repository.closeFinancialYear(input.tenantId, financialYear.uuid, input.updatedBy ?? null);
}
