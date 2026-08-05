import { updateAccount, UpdateAccountDeps } from "./update-account.service";
import {
  AccountNotFoundError,
  AccountGroupNotFoundError,
  AccountGroupAssignmentTypeMismatchError,
  AccountTypeMismatchError,
} from "../domain/errors/accounting.errors";
import { AccountType } from "../domain/enums/account-type.enum";
import { buildAccount, buildAccountGroup, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): UpdateAccountDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("updateAccount", () => {
  it("throws AccountNotFoundError when the Account does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateAccount({ tenantId: 1n, accountUuid: "00000000-0000-0000-0000-000000000700", name: "Revised" }, deps),
    ).rejects.toThrow(AccountNotFoundError);
    expect(deps.repository.updateAccount).not.toHaveBeenCalled();
  });

  it("throws AccountGroupNotFoundError when the new Account Group does not exist", async () => {
    const deps = buildDeps();
    const account = buildAccount({ accountType: AccountType.Asset });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateAccount(
        { tenantId: 1n, accountUuid: account.uuid, accountGroupUuid: "00000000-0000-0000-0000-000000000601" },
        deps,
      ),
    ).rejects.toThrow(AccountGroupNotFoundError);
    expect(deps.repository.updateAccount).not.toHaveBeenCalled();
  });

  it("throws AccountGroupAssignmentTypeMismatchError when the new Account Group's accountType differs from the Account's own", async () => {
    const deps = buildDeps();
    const account = buildAccount({ accountType: AccountType.Asset });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    const accountGroup = buildAccountGroup({ uuid: "00000000-0000-0000-0000-000000000601", accountType: AccountType.Liability });
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(accountGroup);

    await expect(
      updateAccount({ tenantId: 1n, accountUuid: account.uuid, accountGroupUuid: accountGroup.uuid }, deps),
    ).rejects.toThrow(AccountGroupAssignmentTypeMismatchError);
    expect(deps.repository.updateAccount).not.toHaveBeenCalled();
  });

  it("throws AccountNotFoundError when the new parent Account does not exist", async () => {
    const deps = buildDeps();
    const account = buildAccount({ accountType: AccountType.Asset });
    (deps.repository.findAccountByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) =>
      uuid === account.uuid ? account : null,
    );

    await expect(
      updateAccount(
        { tenantId: 1n, accountUuid: account.uuid, parentAccountUuid: "00000000-0000-0000-0000-000000000701" },
        deps,
      ),
    ).rejects.toThrow(AccountNotFoundError);
    expect(deps.repository.updateAccount).not.toHaveBeenCalled();
  });

  it("throws AccountTypeMismatchError when the new parent Account's accountType differs from the Account's own", async () => {
    const deps = buildDeps();
    const account = buildAccount({ uuid: "00000000-0000-0000-0000-000000000700", accountType: AccountType.Asset });
    const parentAccount = buildAccount({ uuid: "00000000-0000-0000-0000-000000000701", accountType: AccountType.Liability });
    (deps.repository.findAccountByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) => {
      if (uuid === account.uuid) return account;
      if (uuid === parentAccount.uuid) return parentAccount;
      return null;
    });

    await expect(
      updateAccount({ tenantId: 1n, accountUuid: account.uuid, parentAccountUuid: parentAccount.uuid }, deps),
    ).rejects.toThrow(AccountTypeMismatchError);
    expect(deps.repository.updateAccount).not.toHaveBeenCalled();
  });

  it("clears the parent Account when parentAccountUuid is explicitly null", async () => {
    const deps = buildDeps();
    const account = buildAccount({ uuid: "00000000-0000-0000-0000-000000000700" });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    (deps.repository.updateAccount as jest.Mock).mockResolvedValue(account);

    await updateAccount({ tenantId: 1n, accountUuid: account.uuid, parentAccountUuid: null }, deps);

    expect(deps.repository.updateAccount).toHaveBeenCalledWith(1n, account.uuid, {
      name: undefined,
      accountGroupId: undefined,
      parentAccountId: null,
      isPostingAccount: undefined,
      updatedBy: null,
    });
  });

  it("updates the Account when every check passes", async () => {
    const deps = buildDeps();
    const account = buildAccount({ uuid: "00000000-0000-0000-0000-000000000700", accountType: AccountType.Asset });
    const accountGroup = buildAccountGroup({ id: 4n, uuid: "00000000-0000-0000-0000-000000000601", accountType: AccountType.Asset });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(accountGroup);
    (deps.repository.updateAccount as jest.Mock).mockResolvedValue(account);

    await updateAccount(
      {
        tenantId: 1n,
        accountUuid: account.uuid,
        name: "Petty Cash",
        accountGroupUuid: accountGroup.uuid,
        isPostingAccount: false,
        updatedBy: 7n,
      },
      deps,
    );

    expect(deps.repository.updateAccount).toHaveBeenCalledWith(1n, account.uuid, {
      name: "Petty Cash",
      accountGroupId: 4n,
      parentAccountId: undefined,
      isPostingAccount: false,
      updatedBy: 7n,
    });
  });
});
