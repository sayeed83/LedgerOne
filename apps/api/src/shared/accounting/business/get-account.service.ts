// Business layer — reads an Account by its external identifier, scoped to
// the supplied Tenant (00_BUSINESS_RULES.md Ch.17.1). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Account } from "../domain/aggregates/account.aggregate";
import { AccountNotFoundError } from "../domain/errors/accounting.errors";

export interface GetAccountInput {
  tenantId: bigint;
  accountUuid: string;
}

export interface GetAccountDeps {
  repository: IAccountingRepository;
}

export async function getAccount(input: GetAccountInput, deps: GetAccountDeps): Promise<Account> {
  const account = await deps.repository.findAccountByUuid(input.tenantId, input.accountUuid);
  if (!account) {
    throw new AccountNotFoundError(input.accountUuid);
  }
  return account;
}
