import { createAccountGroup, CreateAccountGroupDeps, CreateAccountGroupInput } from "./create-account-group.service";
import {
  DuplicateAccountGroupNameError,
  AccountGroupNotFoundError,
  AccountGroupTypeMismatchError,
} from "../domain/errors/accounting.errors";
import { AccountType } from "../domain/enums/account-type.enum";
import { buildAccountGroup, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): CreateAccountGroupDeps {
  return { repository: createFakeAccountingRepository() };
}

function buildInput(overrides: Partial<CreateAccountGroupInput> = {}): CreateAccountGroupInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    name: "Current Assets",
    accountType: AccountType.Asset,
    ...overrides,
  };
}

describe("createAccountGroup", () => {
  it("throws DuplicateAccountGroupNameError when an Account Group with the same name already exists for the Company", async () => {
    const deps = buildDeps();
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([buildAccountGroup({ name: "Current Assets" })]);

    await expect(createAccountGroup(buildInput(), deps)).rejects.toThrow(DuplicateAccountGroupNameError);
    expect(deps.repository.createAccountGroup).not.toHaveBeenCalled();
  });

  it("creates the Account Group when no other Account Group in the Company shares its name", async () => {
    const deps = buildDeps();
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([buildAccountGroup({ name: "Fixed Assets" })]);
    (deps.repository.createAccountGroup as jest.Mock).mockResolvedValue(buildAccountGroup());

    await createAccountGroup(buildInput({ createdBy: 5n }), deps);

    expect(deps.repository.createAccountGroup).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      name: "Current Assets",
      accountType: AccountType.Asset,
      parentAccountGroupId: null,
      createdBy: 5n,
    });
  });

  it("throws AccountGroupNotFoundError when the parent Account Group does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([]);
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      createAccountGroup(buildInput({ parentAccountGroupUuid: "00000000-0000-0000-0000-000000000601" }), deps),
    ).rejects.toThrow(AccountGroupNotFoundError);
    expect(deps.repository.createAccountGroup).not.toHaveBeenCalled();
  });

  it("throws AccountGroupTypeMismatchError when the parent Account Group's accountType differs", async () => {
    const deps = buildDeps();
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([]);
    const parent = buildAccountGroup({ uuid: "00000000-0000-0000-0000-000000000601", accountType: AccountType.Liability });
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(parent);

    await expect(
      createAccountGroup(buildInput({ parentAccountGroupUuid: parent.uuid, accountType: AccountType.Asset }), deps),
    ).rejects.toThrow(AccountGroupTypeMismatchError);
    expect(deps.repository.createAccountGroup).not.toHaveBeenCalled();
  });

  it("creates the Account Group when the parent Account Group's accountType matches", async () => {
    const deps = buildDeps();
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([]);
    const parent = buildAccountGroup({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601", accountType: AccountType.Asset });
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(parent);
    (deps.repository.createAccountGroup as jest.Mock).mockResolvedValue(buildAccountGroup());

    await createAccountGroup(buildInput({ parentAccountGroupUuid: parent.uuid, accountType: AccountType.Asset }), deps);

    expect(deps.repository.createAccountGroup).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      name: "Current Assets",
      accountType: AccountType.Asset,
      parentAccountGroupId: 2n,
      createdBy: null,
    });
  });
});
