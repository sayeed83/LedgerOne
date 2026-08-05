// Business layer — defines a new Account within a Company's Chart of
// Accounts (00_BUSINESS_RULES.md Ch.17.1). Resolves the target Account
// Group by its external `accountGroupUuid` first (mirroring
// create-tax-rule.service.ts resolving its parent Tax Group) — never
// trusting a client-supplied internal id (06_DATABASE_STANDARDS.md
// PK-003). Enforces Ch.18.7 AGP-002 (the Account Group's `accountType` must
// equal this Account's own `accountType`), Ch.17.7 COA-002 (if a
// `parentAccountUuid` is supplied, its `accountType` must equal this
// Account's own), and Ch.17.7 COA-004 (an Account `code` is a never-reused
// identity per Company — `findAccountByCode` matches regardless of the
// other Account's current status, by design, since the unique constraint
// carries no `deletedAt` exclusion). COA-001 (accountType immutable once
// posted) and COA-003 (deactivation blocked while non-zero balance) are
// deliberately NOT enforced anywhere in this module — both require
// Ledger/Journal Entry data that does not exist yet; a future Journal
// Entries module's Business layer is where those checks belong.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { Account } from "../domain/aggregates/account.aggregate";
import { AccountType } from "../domain/enums/account-type.enum";
import {
  AccountGroupNotFoundError,
  AccountGroupAssignmentTypeMismatchError,
  AccountNotFoundError,
  AccountTypeMismatchError,
  DuplicateAccountCodeError,
} from "../domain/errors/accounting.errors";

export interface CreateAccountInput {
  tenantId: bigint;
  companyUuid: string;
  code: string;
  name: string;
  accountType: AccountType;
  accountGroupUuid: string;
  parentAccountUuid?: string;
  isPostingAccount?: boolean;
  createdBy?: bigint | null;
}

export interface CreateAccountDeps {
  repository: IAccountingRepository;
}

export async function createAccount(input: CreateAccountInput, deps: CreateAccountDeps): Promise<Account> {
  const { repository } = deps;

  const existingAccount = await repository.findAccountByCode(input.tenantId, input.companyUuid, input.code);
  if (existingAccount) {
    throw new DuplicateAccountCodeError(input.companyUuid, input.code);
  }

  const accountGroup = await repository.findAccountGroupByUuid(input.tenantId, input.accountGroupUuid);
  if (!accountGroup) {
    throw new AccountGroupNotFoundError(input.accountGroupUuid);
  }
  if (accountGroup.accountType !== input.accountType) {
    throw new AccountGroupAssignmentTypeMismatchError(input.accountGroupUuid, accountGroup.accountType, input.accountType);
  }

  let parentAccountId: bigint | undefined;
  if (input.parentAccountUuid) {
    const parentAccount = await repository.findAccountByUuid(input.tenantId, input.parentAccountUuid);
    if (!parentAccount) {
      throw new AccountNotFoundError(input.parentAccountUuid);
    }
    if (parentAccount.accountType !== input.accountType) {
      throw new AccountTypeMismatchError(input.parentAccountUuid, parentAccount.accountType, input.accountType);
    }
    parentAccountId = parentAccount.id;
  }

  return repository.createAccount(input.tenantId, {
    companyUuid: input.companyUuid,
    code: input.code,
    name: input.name,
    accountType: input.accountType,
    accountGroupId: accountGroup.id,
    parentAccountId: parentAccountId ?? null,
    isPostingAccount: input.isPostingAccount,
    createdBy: input.createdBy ?? null,
  });
}
