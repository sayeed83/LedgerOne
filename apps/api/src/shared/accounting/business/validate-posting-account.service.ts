// Business layer — the guard `createJournalEntry` calls for every line's
// referenced Account (00_BUSINESS_RULES.md Ch.20.8 — "every line must
// reference an Active account") and the frozen architectural decision that
// only Posting Accounts (`isPostingAccount = true`) may receive Journal
// Entry postings (accounting.prisma's `Account` model doc comment). Read-only.
//
// Looked up by `uuid`, never a client-supplied internal `id`
// (06_DATABASE_STANDARDS.md PK-003) — mirrors every other cross-repository
// resolution in this module (e.g. create-account.service.ts resolving its
// Account Group).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Account } from "../domain/aggregates/account.aggregate";
import { AccountStatus } from "../domain/enums/account-status.enum";
import { AccountNotFoundError, AccountNotActiveError, AccountNotPostableError } from "../domain/errors/accounting.errors";

export interface ValidatePostingAccountInput {
  tenantId: bigint;
  accountUuid: string;
}

export interface ValidatePostingAccountDeps {
  repository: IAccountingRepository;
}

export async function validatePostingAccount(
  input: ValidatePostingAccountInput,
  deps: ValidatePostingAccountDeps,
): Promise<Account> {
  const account = await deps.repository.findAccountByUuid(input.tenantId, input.accountUuid);
  if (!account) {
    throw new AccountNotFoundError(input.accountUuid);
  }

  if (account.status !== AccountStatus.Active) {
    throw new AccountNotActiveError(account.uuid, account.status);
  }

  if (!account.isPostingAccount) {
    throw new AccountNotPostableError(account.uuid);
  }

  return account;
}
