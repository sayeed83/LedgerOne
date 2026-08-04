// Business layer — reads a Fiscal Period by its external identifier, scoped
// to the supplied Tenant (00_BUSINESS_RULES.md Ch.6.1). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { FiscalPeriod } from "../domain/aggregates/fiscal-period.aggregate";
import { FiscalPeriodNotFoundError } from "../domain/errors/accounting.errors";

export interface GetFiscalPeriodInput {
  tenantId: bigint;
  fiscalPeriodUuid: string;
}

export interface GetFiscalPeriodDeps {
  repository: IAccountingRepository;
}

export async function getFiscalPeriod(input: GetFiscalPeriodInput, deps: GetFiscalPeriodDeps): Promise<FiscalPeriod> {
  const fiscalPeriod = await deps.repository.findFiscalPeriodByUuid(input.tenantId, input.fiscalPeriodUuid);
  if (!fiscalPeriod) {
    throw new FiscalPeriodNotFoundError(input.fiscalPeriodUuid);
  }
  return fiscalPeriod;
}
