// Business layer — the guard other modules' use cases (e.g. Journal
// Entries, not built yet) call before allowing a posting-affecting
// operation to proceed (00_BUSINESS_RULES.md Ch.6.7 FP-001: a transaction's
// posting date must fall within an Open, or Soft-Closed if authorized,
// Fiscal Period — this guard enforces the plain Open case only; a
// Soft-Closed-with-authorization posting path is a separate, later
// concern), mirroring validate-financial-year-open.service.ts. Read-only.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FiscalPeriod } from "../domain/aggregates/fiscal-period.aggregate";
import { FiscalPeriodStatus } from "../domain/enums/fiscal-period-status.enum";
import { FiscalPeriodNotFoundError, FiscalPeriodNotOpenError } from "../domain/errors/accounting.errors";

export interface ValidateFiscalPeriodOpenInput {
  tenantId: bigint;
  fiscalPeriodUuid: string;
}

export interface ValidateFiscalPeriodOpenDeps {
  repository: IAccountingRepository;
}

export async function validateFiscalPeriodOpen(
  input: ValidateFiscalPeriodOpenInput,
  deps: ValidateFiscalPeriodOpenDeps,
): Promise<FiscalPeriod> {
  const fiscalPeriod = await deps.repository.findFiscalPeriodByUuid(input.tenantId, input.fiscalPeriodUuid);
  if (!fiscalPeriod) {
    throw new FiscalPeriodNotFoundError(input.fiscalPeriodUuid);
  }

  if (fiscalPeriod.status !== FiscalPeriodStatus.Open) {
    throw new FiscalPeriodNotOpenError(fiscalPeriod.uuid, fiscalPeriod.status);
  }

  return fiscalPeriod;
}
