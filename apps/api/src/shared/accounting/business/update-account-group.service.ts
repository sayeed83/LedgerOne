// Business layer — revises an Account Group's name/accountType/parent
// (00_BUSINESS_RULES.md Ch.18.5 — "largely static... platform-provided
// standard groupings", revised only in response to reorganization). Re-
// checks the same duplicate-name rule `createAccountGroup` enforces,
// excluding the row being updated itself, mirroring
// update-tax-group.service.ts's exclude-self overlap check. Also re-checks
// AGP-003 nesting-type-consistency using the *effective* accountType — the
// newly supplied one if given, otherwise the group's own existing value —
// against the (possibly newly supplied) parent's accountType.
//
// `parentAccountGroupUuid` distinguishes three input states: `undefined`
// (not supplied — leave the existing parent untouched, skip resolution
// entirely), `null` (explicitly clear the parent), and a `string` (resolve
// to the new parent's internal id). Only `undefined` skips the resolve
// step.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { AccountGroup } from "../domain/entities/account-group.entity";
import { AccountType } from "../domain/enums/account-type.enum";
import {
  AccountGroupNotFoundError,
  DuplicateAccountGroupNameError,
  AccountGroupTypeMismatchError,
} from "../domain/errors/accounting.errors";

export interface UpdateAccountGroupInput {
  tenantId: bigint;
  accountGroupUuid: string;
  name?: string;
  accountType?: AccountType;
  parentAccountGroupUuid?: string | null;
  updatedBy?: bigint | null;
}

export interface UpdateAccountGroupDeps {
  repository: IAccountingRepository;
}

export async function updateAccountGroup(input: UpdateAccountGroupInput, deps: UpdateAccountGroupDeps): Promise<AccountGroup> {
  const { repository } = deps;

  const accountGroup = await repository.findAccountGroupByUuid(input.tenantId, input.accountGroupUuid);
  if (!accountGroup) {
    throw new AccountGroupNotFoundError(input.accountGroupUuid);
  }

  if (input.name && input.name !== accountGroup.name) {
    const existingGroups = await repository.listAccountGroups(input.tenantId, accountGroup.companyUuid);
    const duplicate = existingGroups.some((group) => group.uuid !== accountGroup.uuid && group.name === input.name);
    if (duplicate) {
      throw new DuplicateAccountGroupNameError(accountGroup.companyUuid, input.name);
    }
  }

  const effectiveAccountType = input.accountType ?? accountGroup.accountType;

  let parentAccountGroupId: bigint | null | undefined;
  if (input.parentAccountGroupUuid === null) {
    parentAccountGroupId = null;
  } else if (input.parentAccountGroupUuid !== undefined) {
    const parentAccountGroup = await repository.findAccountGroupByUuid(input.tenantId, input.parentAccountGroupUuid);
    if (!parentAccountGroup) {
      throw new AccountGroupNotFoundError(input.parentAccountGroupUuid);
    }
    if (parentAccountGroup.accountType !== effectiveAccountType) {
      throw new AccountGroupTypeMismatchError(
        input.parentAccountGroupUuid,
        parentAccountGroup.accountType,
        effectiveAccountType,
      );
    }
    parentAccountGroupId = parentAccountGroup.id;
  }

  return repository.updateAccountGroup(input.tenantId, accountGroup.uuid, {
    name: input.name,
    accountType: input.accountType,
    parentAccountGroupId,
    updatedBy: input.updatedBy ?? null,
  });
}
