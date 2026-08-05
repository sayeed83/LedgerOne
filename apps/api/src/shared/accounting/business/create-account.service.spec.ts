import { createAccount, CreateAccountDeps, CreateAccountInput } from "./create-account.service";
import {
  DuplicateAccountCodeError,
  AccountGroupNotFoundError,
  AccountGroupAssignmentTypeMismatchError,
  AccountNotFoundError,
  AccountTypeMismatchError,
} from "../domain/errors/accounting.errors";
import { AccountType } from "../domain/enums/account-type.enum";
import { buildAccount, buildAccountGroup, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): CreateAccountDeps {
  return { repository: createFakeAccountingRepository() };
}

function buildInput(overrides: Partial<CreateAccountInput> = {}): CreateAccountInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    code: "1000",
    name: "Cash",
    accountType: AccountType.Asset,
    accountGroupUuid: "00000000-0000-0000-0000-000000000600",
    ...overrides,
  };
}

describe("createAccount", () => {
  it("throws DuplicateAccountCodeError when the code already exists for the Company", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByCode as jest.Mock).mockResolvedValue(buildAccount({ code: "1000" }));

    await expect(createAccount(buildInput(), deps)).rejects.toThrow(DuplicateAccountCodeError);
    expect(deps.repository.createAccount).not.toHaveBeenCalled();
  });

  it("throws AccountGroupNotFoundError when the Account Group does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByCode as jest.Mock).mockResolvedValue(null);
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(null);

    await expect(createAccount(buildInput(), deps)).rejects.toThrow(AccountGroupNotFoundError);
    expect(deps.repository.createAccount).not.toHaveBeenCalled();
  });

  it("throws AccountGroupAssignmentTypeMismatchError when the Account Group's accountType differs", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByCode as jest.Mock).mockResolvedValue(null);
    const accountGroup = buildAccountGroup({ accountType: AccountType.Liability });
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(accountGroup);

    await expect(createAccount(buildInput({ accountType: AccountType.Asset }), deps)).rejects.toThrow(
      AccountGroupAssignmentTypeMismatchError,
    );
    expect(deps.repository.createAccount).not.toHaveBeenCalled();
  });

  it("throws AccountNotFoundError when the parent Account does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByCode as jest.Mock).mockResolvedValue(null);
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(
      buildAccountGroup({ accountType: AccountType.Asset }),
    );
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      createAccount(buildInput({ parentAccountUuid: "00000000-0000-0000-0000-000000000701" }), deps),
    ).rejects.toThrow(AccountNotFoundError);
    expect(deps.repository.createAccount).not.toHaveBeenCalled();
  });

  it("throws AccountTypeMismatchError when the parent Account's accountType differs", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByCode as jest.Mock).mockResolvedValue(null);
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(
      buildAccountGroup({ accountType: AccountType.Asset }),
    );
    const parentAccount = buildAccount({
      uuid: "00000000-0000-0000-0000-000000000701",
      accountType: AccountType.Liability,
    });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(parentAccount);

    await expect(
      createAccount(buildInput({ parentAccountUuid: parentAccount.uuid, accountType: AccountType.Asset }), deps),
    ).rejects.toThrow(AccountTypeMismatchError);
    expect(deps.repository.createAccount).not.toHaveBeenCalled();
  });

  it("creates the Account when every check passes", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByCode as jest.Mock).mockResolvedValue(null);
    const accountGroup = buildAccountGroup({ id: 3n, accountType: AccountType.Asset });
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(accountGroup);
    (deps.repository.createAccount as jest.Mock).mockResolvedValue(buildAccount());

    await createAccount(buildInput({ isPostingAccount: true, createdBy: 5n }), deps);

    expect(deps.repository.createAccount).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      code: "1000",
      name: "Cash",
      accountType: AccountType.Asset,
      accountGroupId: 3n,
      parentAccountId: null,
      isPostingAccount: true,
      createdBy: 5n,
    });
  });
});
