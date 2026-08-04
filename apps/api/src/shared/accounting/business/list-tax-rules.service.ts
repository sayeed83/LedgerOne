// Business layer — lists Tax Rules within a Tenant, optionally narrowed to
// a single Tax Group (00_BUSINESS_RULES.md Ch.68.1). Accepts the external
// `taxGroupUuid` for the optional filter (never the internal `taxGroupId`,
// 06_DATABASE_STANDARDS.md PK-003), resolving it to its internal id before
// delegating to the Repository, mirroring list-exchange-rates.service.ts's
// own resolution of `fromCurrencyUuid`/`toCurrencyUuid`.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { TaxRule } from "../domain/entities/tax-rule.entity";
import { TaxGroupNotFoundError } from "../domain/errors/accounting.errors";

export interface ListTaxRulesInput {
  tenantId: bigint;
  taxGroupUuid?: string;
}

export interface ListTaxRulesDeps {
  repository: IAccountingRepository;
}

export async function listTaxRules(input: ListTaxRulesInput, deps: ListTaxRulesDeps): Promise<TaxRule[]> {
  const { repository } = deps;

  let taxGroupId: bigint | undefined;
  if (input.taxGroupUuid) {
    const taxGroup = await repository.findTaxGroupByUuid(input.tenantId, input.taxGroupUuid);
    if (!taxGroup) {
      throw new TaxGroupNotFoundError(input.taxGroupUuid);
    }
    taxGroupId = taxGroup.id;
  }

  return repository.listTaxRules(input.tenantId, taxGroupId);
}
