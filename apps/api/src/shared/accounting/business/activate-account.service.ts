// Business layer — transitions an Account to Active (00_BUSINESS_RULES.md
// Ch.17.5): valid from Draft or Inactive. The Domain aggregate's
// `activate()` enforces the transition is legal (05_CODING_STANDARDS.md
// Ch.15.4) before this use case persists it, mirroring
// open-financial-year.service.ts's identical find -> call aggregate method
// -> persist pattern.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Account } from "../domain/aggregates/account.aggregate";
import { AccountNotFoundError } from "../domain/errors/accounting.errors";

export interface ActivateAccountInput {
  tenantId: bigint;
  accountUuid: string;
  updatedBy?: bigint | null;
}

export interface ActivateAccountDeps {
  repository: IAccountingRepository;
}

export async function activateAccount(input: ActivateAccountInput, deps: ActivateAccountDeps): Promise<Account> {
  const { repository } = deps;

  const account = await repository.findAccountByUuid(input.tenantId, input.accountUuid);
  if (!account) {
    throw new AccountNotFoundError(input.accountUuid);
  }

  account.activate();
  return repository.activateAccount(input.tenantId, account.uuid, input.updatedBy ?? null);
}
