// Business layer — lists Account Groups within a Tenant, optionally
// narrowed to a single Company (00_BUSINESS_RULES.md Ch.18.1).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { AccountGroup } from "../domain/entities/account-group.entity";

export interface ListAccountGroupsInput {
  tenantId: bigint;
  companyUuid?: string;
}

export interface ListAccountGroupsDeps {
  repository: IAccountingRepository;
}

export async function listAccountGroups(input: ListAccountGroupsInput, deps: ListAccountGroupsDeps): Promise<AccountGroup[]> {
  return deps.repository.listAccountGroups(input.tenantId, input.companyUuid);
}
