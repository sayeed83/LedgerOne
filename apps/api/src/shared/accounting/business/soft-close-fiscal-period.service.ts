// Business layer — transitions a Fiscal Period to SoftClosed
// (00_BUSINESS_RULES.md Ch.6.5): valid only from Open. The Domain
// aggregate's `softClose()` enforces the transition is legal
// (05_CODING_STANDARDS.md Ch.15.4) before this use case persists it.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FiscalPeriod } from "../domain/aggregates/fiscal-period.aggregate";
import { FiscalPeriodNotFoundError } from "../domain/errors/accounting.errors";

export interface SoftCloseFiscalPeriodInput {
  tenantId: bigint;
  fiscalPeriodUuid: string;
  updatedBy?: bigint | null;
}

export interface SoftCloseFiscalPeriodDeps {
  repository: IAccountingRepository;
}

export async function softCloseFiscalPeriod(
  input: SoftCloseFiscalPeriodInput,
  deps: SoftCloseFiscalPeriodDeps,
): Promise<FiscalPeriod> {
  const { repository } = deps;

  const fiscalPeriod = await repository.findFiscalPeriodByUuid(input.tenantId, input.fiscalPeriodUuid);
  if (!fiscalPeriod) {
    throw new FiscalPeriodNotFoundError(input.fiscalPeriodUuid);
  }

  fiscalPeriod.softClose();
  return repository.softCloseFiscalPeriod(input.tenantId, fiscalPeriod.uuid, input.updatedBy ?? null);
}
