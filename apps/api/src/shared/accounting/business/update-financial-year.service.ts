// Business layer — revises a Financial Year's start/end dates
// (00_BUSINESS_RULES.md Ch.5.1). Status is never changed here (see
// open/close/reopen-financial-year.service.ts). If either date is being
// changed, the revised range must still not overlap any other Financial
// Year already registered for the same Company (Ch.5.7 FY-002, Ch.5.8
// Validation Rules) — mirrors create-financial-year.service.ts's check,
// excluding the Financial Year being revised itself, the same
// exclude-self pattern as Authorization's update-role.service.ts.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FinancialYear } from "../domain/aggregates/financial-year.aggregate";
import { FinancialYearNotFoundError, FinancialYearOverlapError } from "../domain/errors/accounting.errors";

export interface UpdateFinancialYearInput {
  tenantId: bigint;
  financialYearUuid: string;
  startDate?: Date;
  endDate?: Date;
  updatedBy?: bigint | null;
}

export interface UpdateFinancialYearDeps {
  repository: IAccountingRepository;
}

export async function updateFinancialYear(input: UpdateFinancialYearInput, deps: UpdateFinancialYearDeps): Promise<FinancialYear> {
  const { repository } = deps;

  const financialYear = await repository.findFinancialYearByUuid(input.tenantId, input.financialYearUuid);
  if (!financialYear) {
    throw new FinancialYearNotFoundError(input.financialYearUuid);
  }

  const revisedStartDate = input.startDate ?? financialYear.startDate;
  const revisedEndDate = input.endDate ?? financialYear.endDate;

  if (input.startDate || input.endDate) {
    const existingYears = await repository.listFinancialYears(input.tenantId, financialYear.companyUuid);
    const overlaps = existingYears.some(
      (year) =>
        year.uuid !== financialYear.uuid &&
        revisedStartDate <= year.endDate &&
        revisedEndDate >= year.startDate,
    );
    if (overlaps) {
      throw new FinancialYearOverlapError(financialYear.companyUuid, revisedStartDate, revisedEndDate);
    }
  }

  return repository.updateFinancialYear(input.tenantId, financialYear.uuid, {
    startDate: input.startDate,
    endDate: input.endDate,
    updatedBy: input.updatedBy ?? null,
  });
}
