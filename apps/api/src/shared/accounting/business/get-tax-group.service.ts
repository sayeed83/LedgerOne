// Business layer — reads a Tax Group by its external identifier, scoped to
// the supplied Tenant (00_BUSINESS_RULES.md Ch.67.1). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { TaxGroup } from "../domain/entities/tax-group.entity";
import { TaxGroupNotFoundError } from "../domain/errors/accounting.errors";

export interface GetTaxGroupInput {
  tenantId: bigint;
  taxGroupUuid: string;
}

export interface GetTaxGroupDeps {
  repository: IAccountingRepository;
}

export async function getTaxGroup(input: GetTaxGroupInput, deps: GetTaxGroupDeps): Promise<TaxGroup> {
  const taxGroup = await deps.repository.findTaxGroupByUuid(input.tenantId, input.taxGroupUuid);
  if (!taxGroup) {
    throw new TaxGroupNotFoundError(input.taxGroupUuid);
  }
  return taxGroup;
}
