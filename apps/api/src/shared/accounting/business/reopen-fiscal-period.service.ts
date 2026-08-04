// Business layer — transitions a Fiscal Period to Reopened
// (00_BUSINESS_RULES.md Ch.6.5/FP-003): valid only from Closed. FP-003:
// reopening a period that is not the most recently closed one requires the
// same elevated approval as reopening a Financial Year (Ch.5, FY-004) — that
// approval workflow and "most recently closed" determination are separate,
// later concerns; this use case only enforces the lifecycle transition
// itself via the Domain aggregate's `reopen()` (05_CODING_STANDARDS.md
// Ch.15.4) before persisting it, mirroring reopen-financial-year.service.ts.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FiscalPeriod } from "../domain/aggregates/fiscal-period.aggregate";
import { FiscalPeriodNotFoundError } from "../domain/errors/accounting.errors";

export interface ReopenFiscalPeriodInput {
  tenantId: bigint;
  fiscalPeriodUuid: string;
  updatedBy?: bigint | null;
}

export interface ReopenFiscalPeriodDeps {
  repository: IAccountingRepository;
}

export async function reopenFiscalPeriod(input: ReopenFiscalPeriodInput, deps: ReopenFiscalPeriodDeps): Promise<FiscalPeriod> {
  const { repository } = deps;

  const fiscalPeriod = await repository.findFiscalPeriodByUuid(input.tenantId, input.fiscalPeriodUuid);
  if (!fiscalPeriod) {
    throw new FiscalPeriodNotFoundError(input.fiscalPeriodUuid);
  }

  fiscalPeriod.reopen();
  return repository.reopenFiscalPeriod(input.tenantId, fiscalPeriod.uuid, input.updatedBy ?? null);
}
