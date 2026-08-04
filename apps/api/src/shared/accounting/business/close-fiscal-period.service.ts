// Business layer — transitions a Fiscal Period to Closed
// (00_BUSINESS_RULES.md Ch.6.5): valid only from SoftClosed or Reopened. The
// Domain aggregate's `close()` enforces the transition is legal
// (05_CODING_STANDARDS.md Ch.15.4) before this use case persists it.
// FP-002's chronological-close ordering (an earlier period in the same
// Financial Year must not still be Open) is explicitly not enforced here —
// a later Business-layer refinement once cross-period sequencing rules are
// confirmed, mirroring how Financial Closing (Ch.32) mechanics remain out of
// scope for closeFinancialYear.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FiscalPeriod } from "../domain/aggregates/fiscal-period.aggregate";
import { FiscalPeriodNotFoundError } from "../domain/errors/accounting.errors";

export interface CloseFiscalPeriodInput {
  tenantId: bigint;
  fiscalPeriodUuid: string;
  updatedBy?: bigint | null;
}

export interface CloseFiscalPeriodDeps {
  repository: IAccountingRepository;
}

export async function closeFiscalPeriod(input: CloseFiscalPeriodInput, deps: CloseFiscalPeriodDeps): Promise<FiscalPeriod> {
  const { repository } = deps;

  const fiscalPeriod = await repository.findFiscalPeriodByUuid(input.tenantId, input.fiscalPeriodUuid);
  if (!fiscalPeriod) {
    throw new FiscalPeriodNotFoundError(input.fiscalPeriodUuid);
  }

  fiscalPeriod.close();
  return repository.closeFiscalPeriod(input.tenantId, fiscalPeriod.uuid, input.updatedBy ?? null);
}
