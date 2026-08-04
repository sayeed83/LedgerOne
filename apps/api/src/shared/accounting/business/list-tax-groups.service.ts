// Business layer — lists Tax Groups within a Tenant, optionally narrowed to
// a single Company (00_BUSINESS_RULES.md Ch.67.1).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { TaxGroup } from "../domain/entities/tax-group.entity";

export interface ListTaxGroupsInput {
  tenantId: bigint;
  companyUuid?: string;
}

export interface ListTaxGroupsDeps {
  repository: IAccountingRepository;
}

export async function listTaxGroups(input: ListTaxGroupsInput, deps: ListTaxGroupsDeps): Promise<TaxGroup[]> {
  return deps.repository.listTaxGroups(input.tenantId, input.companyUuid);
}
