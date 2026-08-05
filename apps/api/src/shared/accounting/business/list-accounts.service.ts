// Business layer — lists Accounts within a Tenant, optionally narrowed to a
// single Company, a single Account Group, and/or a single lifecycle status
// (00_BUSINESS_RULES.md Ch.17.1). Accepts the external `accountGroupUuid`
// for the optional filter (never the internal `accountGroupId`,
// 06_DATABASE_STANDARDS.md PK-003), resolving it to its internal id before
// delegating to the Repository, mirroring list-tax-rules.service.ts's own
// resolution of `taxGroupUuid`.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Account } from "../domain/aggregates/account.aggregate";
import { AccountStatus } from "../domain/enums/account-status.enum";
import { AccountGroupNotFoundError } from "../domain/errors/accounting.errors";

export interface ListAccountsInput {
  tenantId: bigint;
  companyUuid?: string;
  accountGroupUuid?: string;
  status?: AccountStatus;
}

export interface ListAccountsDeps {
  repository: IAccountingRepository;
}

export async function listAccounts(input: ListAccountsInput, deps: ListAccountsDeps): Promise<Account[]> {
  const { repository } = deps;

  let accountGroupId: bigint | undefined;
  if (input.accountGroupUuid) {
    const accountGroup = await repository.findAccountGroupByUuid(input.tenantId, input.accountGroupUuid);
    if (!accountGroup) {
      throw new AccountGroupNotFoundError(input.accountGroupUuid);
    }
    accountGroupId = accountGroup.id;
  }

  return repository.listAccounts(input.tenantId, input.companyUuid, accountGroupId, input.status);
}
