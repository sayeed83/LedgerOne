// Business layer — transitions an Account to Inactive (00_BUSINESS_RULES.md
// Ch.17.5): valid only from Active. The Domain aggregate's `deactivate()`
// enforces the transition is legal (05_CODING_STANDARDS.md Ch.15.4) before
// this use case persists it, mirroring activate-account.service.ts's
// identical find -> call aggregate method -> persist pattern. COA-003's
// deactivation-blocked-while-non-zero-balance/open-transaction rule is
// deliberately NOT enforced here — it requires Ledger/Journal Entry data
// that does not exist yet; a future Journal Entries module's Business layer
// is where that check belongs (mirroring the Account aggregate's own
// documented deferral).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Account } from "../domain/aggregates/account.aggregate";
import { AccountNotFoundError } from "../domain/errors/accounting.errors";

export interface DeactivateAccountInput {
  tenantId: bigint;
  accountUuid: string;
  updatedBy?: bigint | null;
}

export interface DeactivateAccountDeps {
  repository: IAccountingRepository;
}

export async function deactivateAccount(input: DeactivateAccountInput, deps: DeactivateAccountDeps): Promise<Account> {
  const { repository } = deps;

  const account = await repository.findAccountByUuid(input.tenantId, input.accountUuid);
  if (!account) {
    throw new AccountNotFoundError(input.accountUuid);
  }

  account.deactivate();
  return repository.deactivateAccount(input.tenantId, account.uuid, input.updatedBy ?? null);
}
