// Business layer — revises a Fiscal Period's start/end dates
// (00_BUSINESS_RULES.md Ch.6.1). Status is never changed here (see
// soft-close/close/reopen-fiscal-period.service.ts). A Closed Fiscal Period
// is final and cannot be modified (Ch.6.8 Validation Rules) — checked before
// anything else. If either date is being changed, the revised range must
// still not overlap any other Fiscal Period within the same Financial Year
// (Ch.6), mirroring update-financial-year.service.ts's exclude-self overlap
// check.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FiscalPeriod } from "../domain/aggregates/fiscal-period.aggregate";
import { FiscalPeriodStatus } from "../domain/enums/fiscal-period-status.enum";
import { FiscalPeriodNotFoundError, FiscalPeriodClosedError, FiscalPeriodOverlapError } from "../domain/errors/accounting.errors";

export interface UpdateFiscalPeriodInput {
  tenantId: bigint;
  fiscalPeriodUuid: string;
  startDate?: Date;
  endDate?: Date;
  updatedBy?: bigint | null;
}

export interface UpdateFiscalPeriodDeps {
  repository: IAccountingRepository;
}

export async function updateFiscalPeriod(input: UpdateFiscalPeriodInput, deps: UpdateFiscalPeriodDeps): Promise<FiscalPeriod> {
  const { repository } = deps;

  const fiscalPeriod = await repository.findFiscalPeriodByUuid(input.tenantId, input.fiscalPeriodUuid);
  if (!fiscalPeriod) {
    throw new FiscalPeriodNotFoundError(input.fiscalPeriodUuid);
  }

  if (fiscalPeriod.status === FiscalPeriodStatus.Closed) {
    throw new FiscalPeriodClosedError(fiscalPeriod.uuid);
  }

  const revisedStartDate = input.startDate ?? fiscalPeriod.startDate;
  const revisedEndDate = input.endDate ?? fiscalPeriod.endDate;

  if (input.startDate || input.endDate) {
    const existingPeriods = await repository.listFiscalPeriods(input.tenantId, fiscalPeriod.financialYearId);
    const overlaps = existingPeriods.some(
      (period) =>
        period.uuid !== fiscalPeriod.uuid &&
        revisedStartDate <= period.endDate &&
        revisedEndDate >= period.startDate,
    );
    if (overlaps) {
      throw new FiscalPeriodOverlapError(String(fiscalPeriod.financialYearId), revisedStartDate, revisedEndDate);
    }
  }

  return repository.updateFiscalPeriod(input.tenantId, fiscalPeriod.uuid, {
    startDate: input.startDate,
    endDate: input.endDate,
    updatedBy: input.updatedBy ?? null,
  });
}
