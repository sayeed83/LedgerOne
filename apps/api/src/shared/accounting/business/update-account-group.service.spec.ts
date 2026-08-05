import { updateAccountGroup, UpdateAccountGroupDeps } from "./update-account-group.service";
import {
  AccountGroupNotFoundError,
  DuplicateAccountGroupNameError,
  AccountGroupTypeMismatchError,
} from "../domain/errors/accounting.errors";
import { AccountType } from "../domain/enums/account-type.enum";
import { buildAccountGroup, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): UpdateAccountGroupDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("updateAccountGroup", () => {
  it("throws AccountGroupNotFoundError when the Account Group does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateAccountGroup({ tenantId: 1n, accountGroupUuid: "00000000-0000-0000-0000-000000000600", name: "Revised" }, deps),
    ).rejects.toThrow(AccountGroupNotFoundError);
    expect(deps.repository.updateAccountGroup).not.toHaveBeenCalled();
  });

  it("throws DuplicateAccountGroupNameError when renaming to a name another Account Group in the same Company already uses", async () => {
    const deps = buildDeps();
    const accountGroup = buildAccountGroup({ uuid: "00000000-0000-0000-0000-000000000600", name: "Current Assets" });
    const other = buildAccountGroup({ uuid: "00000000-0000-0000-0000-000000000601", name: "Fixed Assets" });
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(accountGroup);
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([accountGroup, other]);

    await expect(
      updateAccountGroup({ tenantId: 1n, accountGroupUuid: accountGroup.uuid, name: "Fixed Assets" }, deps),
    ).rejects.toThrow(DuplicateAccountGroupNameError);
    expect(deps.repository.updateAccountGroup).not.toHaveBeenCalled();
  });

  it("does not re-check duplicates when the name is unchanged", async () => {
    const deps = buildDeps();
    const accountGroup = buildAccountGroup({ uuid: "00000000-0000-0000-0000-000000000600", name: "Current Assets" });
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(accountGroup);
    (deps.repository.updateAccountGroup as jest.Mock).mockResolvedValue(accountGroup);

    await updateAccountGroup({ tenantId: 1n, accountGroupUuid: accountGroup.uuid, name: "Current Assets" }, deps);

    expect(deps.repository.listAccountGroups).not.toHaveBeenCalled();
    expect(deps.repository.updateAccountGroup).toHaveBeenCalled();
  });

  it("throws AccountGroupNotFoundError when the new parent Account Group does not exist", async () => {
    const deps = buildDeps();
    const accountGroup = buildAccountGroup({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) =>
      uuid === accountGroup.uuid ? accountGroup : null,
    );

    await expect(
      updateAccountGroup(
        {
          tenantId: 1n,
          accountGroupUuid: accountGroup.uuid,
          parentAccountGroupUuid: "00000000-0000-0000-0000-000000000601",
        },
        deps,
      ),
    ).rejects.toThrow(AccountGroupNotFoundError);
    expect(deps.repository.updateAccountGroup).not.toHaveBeenCalled();
  });

  it("throws AccountGroupTypeMismatchError when the new parent's accountType differs from the effective accountType", async () => {
    const deps = buildDeps();
    const accountGroup = buildAccountGroup({
      uuid: "00000000-0000-0000-0000-000000000600",
      accountType: AccountType.Asset,
    });
    const parent = buildAccountGroup({
      id: 2n,
      uuid: "00000000-0000-0000-0000-000000000601",
      accountType: AccountType.Liability,
    });
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) => {
      if (uuid === accountGroup.uuid) return accountGroup;
      if (uuid === parent.uuid) return parent;
      return null;
    });

    await expect(
      updateAccountGroup(
        { tenantId: 1n, accountGroupUuid: accountGroup.uuid, parentAccountGroupUuid: parent.uuid },
        deps,
      ),
    ).rejects.toThrow(AccountGroupTypeMismatchError);
    expect(deps.repository.updateAccountGroup).not.toHaveBeenCalled();
  });

  it("clears the parent when parentAccountGroupUuid is explicitly null", async () => {
    const deps = buildDeps();
    const accountGroup = buildAccountGroup({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(accountGroup);
    (deps.repository.updateAccountGroup as jest.Mock).mockResolvedValue(accountGroup);

    await updateAccountGroup(
      { tenantId: 1n, accountGroupUuid: accountGroup.uuid, parentAccountGroupUuid: null },
      deps,
    );

    expect(deps.repository.updateAccountGroup).toHaveBeenCalledWith(1n, accountGroup.uuid, {
      name: undefined,
      accountType: undefined,
      parentAccountGroupId: null,
      updatedBy: null,
    });
  });

  it("updates the Account Group when the new parent's accountType matches the effective accountType", async () => {
    const deps = buildDeps();
    const accountGroup = buildAccountGroup({
      uuid: "00000000-0000-0000-0000-000000000600",
      accountType: AccountType.Asset,
    });
    const parent = buildAccountGroup({
      id: 2n,
      uuid: "00000000-0000-0000-0000-000000000601",
      accountType: AccountType.Asset,
    });
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) => {
      if (uuid === accountGroup.uuid) return accountGroup;
      if (uuid === parent.uuid) return parent;
      return null;
    });
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([accountGroup]);
    (deps.repository.updateAccountGroup as jest.Mock).mockResolvedValue(accountGroup);

    await updateAccountGroup(
      {
        tenantId: 1n,
        accountGroupUuid: accountGroup.uuid,
        name: "Renamed",
        parentAccountGroupUuid: parent.uuid,
        updatedBy: 7n,
      },
      deps,
    );

    expect(deps.repository.updateAccountGroup).toHaveBeenCalledWith(1n, accountGroup.uuid, {
      name: "Renamed",
      accountType: undefined,
      parentAccountGroupId: 2n,
      updatedBy: 7n,
    });
  });
});
