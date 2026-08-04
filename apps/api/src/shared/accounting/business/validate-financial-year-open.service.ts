// Business layer — the guard other modules' use cases (e.g. Journal
// Entries, not built yet) call before allowing a posting-affecting
// operation to proceed (00_BUSINESS_RULES.md Ch.5.7 FY-003: "No
// transaction may be posted into a Closed Financial Year"), mirroring
// Organization's ValidateTenantIsActive and User Management's
// ValidateUserActive. Read-only.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FinancialYear } from "../domain/aggregates/financial-year.aggregate";
import { FinancialYearStatus } from "../domain/enums/financial-year-status.enum";
import { FinancialYearNotFoundError, FinancialYearNotOpenError } from "../domain/errors/accounting.errors";

export interface ValidateFinancialYearOpenInput {
  tenantId: bigint;
  financialYearUuid: string;
}

export interface ValidateFinancialYearOpenDeps {
  repository: IAccountingRepository;
}

export async function validateFinancialYearOpen(
  input: ValidateFinancialYearOpenInput,
  deps: ValidateFinancialYearOpenDeps,
): Promise<FinancialYear> {
  const financialYear = await deps.repository.findFinancialYearByUuid(input.tenantId, input.financialYearUuid);
  if (!financialYear) {
    throw new FinancialYearNotFoundError(input.financialYearUuid);
  }

  if (financialYear.status !== FinancialYearStatus.Open) {
    throw new FinancialYearNotOpenError(financialYear.uuid, financialYear.status);
  }

  return financialYear;
}
