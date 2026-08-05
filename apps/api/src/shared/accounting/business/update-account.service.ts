// Business layer — revises an Account's name/Account Group/parent/posting
// flag (00_BUSINESS_RULES.md Ch.17.5). `code`/`accountType` are never
// accepted here — Ch.17.7 COA-004 makes `code` a never-reused identity, and
// COA-001 makes `accountType` immutable once posted; `UpdateAccountProps`
// (Repository layer) structurally excludes both already, mirroring
// Tax Rule's own immutability posture. Re-checks Ch.18.7 AGP-002 and
// Ch.17.7 COA-002 using the Account's own existing (immutable)
// `accountType` whenever a new Account Group or parent Account is supplied.
//
// `parentAccountUuid` distinguishes three input states: `undefined` (not
// supplied — leave the existing parent untouched), `null` (explicitly clear
// the parent), and a `string` (resolve to the new parent's internal id and
// re-check COA-002) — mirroring update-account-group.service.ts's identical
// explicit-null-vs-omitted handling for `parentAccountGroupUuid`.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Account } from "../domain/aggregates/account.aggregate";
import {
  AccountNotFoundError,
  AccountGroupNotFoundError,
  AccountGroupAssignmentTypeMismatchError,
  AccountTypeMismatchError,
} from "../domain/errors/accounting.errors";

export interface UpdateAccountInput {
  tenantId: bigint;
  accountUuid: string;
  name?: string;
  accountGroupUuid?: string;
  parentAccountUuid?: string | null;
  isPostingAccount?: boolean;
  updatedBy?: bigint | null;
}

export interface UpdateAccountDeps {
  repository: IAccountingRepository;
}

export async function updateAccount(input: UpdateAccountInput, deps: UpdateAccountDeps): Promise<Account> {
  const { repository } = deps;

  const account = await repository.findAccountByUuid(input.tenantId, input.accountUuid);
  if (!account) {
    throw new AccountNotFoundError(input.accountUuid);
  }

  let accountGroupId: bigint | undefined;
  if (input.accountGroupUuid !== undefined) {
    const accountGroup = await repository.findAccountGroupByUuid(input.tenantId, input.accountGroupUuid);
    if (!accountGroup) {
      throw new AccountGroupNotFoundError(input.accountGroupUuid);
    }
    if (accountGroup.accountType !== account.accountType) {
      throw new AccountGroupAssignmentTypeMismatchError(input.accountGroupUuid, accountGroup.accountType, account.accountType);
    }
    accountGroupId = accountGroup.id;
  }

  let parentAccountId: bigint | null | undefined;
  if (input.parentAccountUuid === null) {
    parentAccountId = null;
  } else if (input.parentAccountUuid !== undefined) {
    const parentAccount = await repository.findAccountByUuid(input.tenantId, input.parentAccountUuid);
    if (!parentAccount) {
      throw new AccountNotFoundError(input.parentAccountUuid);
    }
    if (parentAccount.accountType !== account.accountType) {
      throw new AccountTypeMismatchError(input.parentAccountUuid, parentAccount.accountType, account.accountType);
    }
    parentAccountId = parentAccount.id;
  }

  return repository.updateAccount(input.tenantId, account.uuid, {
    name: input.name,
    accountGroupId,
    parentAccountId,
    isPostingAccount: input.isPostingAccount,
    updatedBy: input.updatedBy ?? null,
  });
}
