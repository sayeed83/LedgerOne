// Business layer — reads an Account Group by its external identifier,
// scoped to the supplied Tenant (00_BUSINESS_RULES.md Ch.18.1). Never
// resolves by the internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers
// outside this module only ever hold the `uuid`.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { AccountGroup } from "../domain/entities/account-group.entity";
import { AccountGroupNotFoundError } from "../domain/errors/accounting.errors";

export interface GetAccountGroupInput {
  tenantId: bigint;
  accountGroupUuid: string;
}

export interface GetAccountGroupDeps {
  repository: IAccountingRepository;
}

export async function getAccountGroup(input: GetAccountGroupInput, deps: GetAccountGroupDeps): Promise<AccountGroup> {
  const accountGroup = await deps.repository.findAccountGroupByUuid(input.tenantId, input.accountGroupUuid);
  if (!accountGroup) {
    throw new AccountGroupNotFoundError(input.accountGroupUuid);
  }
  return accountGroup;
}
