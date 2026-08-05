// Business layer — defines a new Account Group for a Company
// (00_BUSINESS_RULES.md Ch.18.1). No two (non-deleted) Account Groups may
// share the same name within a Company — checked here rather than left
// unenforced, mirroring create-tax-group.service.ts's identical duplicate-
// name-within-company check. `companyUuid` is a cross-module reference
// (FK-002) to Organization's `companies.uuid`; its existence is not
// validated here, mirroring create-financial-year.service.ts's own
// `companyUuid` handling. If a `parentAccountGroupUuid` is supplied, it is
// resolved first (never trusting a client-supplied internal id,
// 06_DATABASE_STANDARDS.md PK-003) and its `accountType` must equal this
// group's own `accountType` (Ch.18.7 AGP-003 — nesting must preserve a
// consistent classification down the tree).
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { AccountGroup } from "../domain/entities/account-group.entity";
import { AccountType } from "../domain/enums/account-type.enum";
import {
  AccountGroupNotFoundError,
  DuplicateAccountGroupNameError,
  AccountGroupTypeMismatchError,
} from "../domain/errors/accounting.errors";

export interface CreateAccountGroupInput {
  tenantId: bigint;
  companyUuid: string;
  name: string;
  accountType: AccountType;
  parentAccountGroupUuid?: string;
  createdBy?: bigint | null;
}

export interface CreateAccountGroupDeps {
  repository: IAccountingRepository;
}

export async function createAccountGroup(input: CreateAccountGroupInput, deps: CreateAccountGroupDeps): Promise<AccountGroup> {
  const { repository } = deps;

  const existingGroups = await repository.listAccountGroups(input.tenantId, input.companyUuid);
  const duplicate = existingGroups.some((group) => group.name === input.name);
  if (duplicate) {
    throw new DuplicateAccountGroupNameError(input.companyUuid, input.name);
  }

  let parentAccountGroupId: bigint | undefined;
  if (input.parentAccountGroupUuid) {
    const parentAccountGroup = await repository.findAccountGroupByUuid(input.tenantId, input.parentAccountGroupUuid);
    if (!parentAccountGroup) {
      throw new AccountGroupNotFoundError(input.parentAccountGroupUuid);
    }
    if (parentAccountGroup.accountType !== input.accountType) {
      throw new AccountGroupTypeMismatchError(input.parentAccountGroupUuid, parentAccountGroup.accountType, input.accountType);
    }
    parentAccountGroupId = parentAccountGroup.id;
  }

  return repository.createAccountGroup(input.tenantId, {
    companyUuid: input.companyUuid,
    name: input.name,
    accountType: input.accountType,
    parentAccountGroupId: parentAccountGroupId ?? null,
    createdBy: input.createdBy ?? null,
  });
}
