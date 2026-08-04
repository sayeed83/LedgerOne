// Business layer — transitions a Financial Year to Reopened
// (00_BUSINESS_RULES.md Ch.5.5/FY-004): valid only from Closed. FY-004:
// "Reopening a Closed Financial Year requires explicit approval (Ch.32)
// and is itself a heavily audited exception, never a routine operation" —
// the approval workflow and audit trail (Ch.32, Ch.85) are separate,
// later concerns; this use case only enforces the lifecycle transition
// itself via the Domain aggregate's `reopen()` (05_CODING_STANDARDS.md
// Ch.15.4) before persisting it.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FinancialYear } from "../domain/aggregates/financial-year.aggregate";
import { FinancialYearNotFoundError } from "../domain/errors/accounting.errors";

export interface ReopenFinancialYearInput {
  tenantId: bigint;
  financialYearUuid: string;
  updatedBy?: bigint | null;
}

export interface ReopenFinancialYearDeps {
  repository: IAccountingRepository;
}

export async function reopenFinancialYear(input: ReopenFinancialYearInput, deps: ReopenFinancialYearDeps): Promise<FinancialYear> {
  const { repository } = deps;

  const financialYear = await repository.findFinancialYearByUuid(input.tenantId, input.financialYearUuid);
  if (!financialYear) {
    throw new FinancialYearNotFoundError(input.financialYearUuid);
  }

  financialYear.reopen();
  return repository.reopenFinancialYear(input.tenantId, financialYear.uuid, input.updatedBy ?? null);
}
