// Business layer — reads a Tax Rule by its external identifier, scoped to
// the supplied Tenant (00_BUSINESS_RULES.md Ch.68.1). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { TaxRule } from "../domain/entities/tax-rule.entity";
import { TaxRuleNotFoundError } from "../domain/errors/accounting.errors";

export interface GetTaxRuleInput {
  tenantId: bigint;
  taxRuleUuid: string;
}

export interface GetTaxRuleDeps {
  repository: IAccountingRepository;
}

export async function getTaxRule(input: GetTaxRuleInput, deps: GetTaxRuleDeps): Promise<TaxRule> {
  const taxRule = await deps.repository.findTaxRuleByUuid(input.tenantId, input.taxRuleUuid);
  if (!taxRule) {
    throw new TaxRuleNotFoundError(input.taxRuleUuid);
  }
  return taxRule;
}
