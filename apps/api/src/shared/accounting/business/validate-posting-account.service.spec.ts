import { validatePostingAccount, ValidatePostingAccountDeps } from "./validate-posting-account.service";
import { AccountNotFoundError, AccountNotActiveError, AccountNotPostableError } from "../domain/errors/accounting.errors";
import { AccountStatus } from "../domain/enums/account-status.enum";
import { buildAccount, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ValidatePostingAccountDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("validatePostingAccount", () => {
  it("throws AccountNotFoundError when the Account does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      validatePostingAccount({ tenantId: 1n, accountUuid: "missing-uuid" }, deps),
    ).rejects.toThrow(AccountNotFoundError);
  });

  it("throws AccountNotActiveError when the Account is Draft", async () => {
    const deps = buildDeps();
    const account = buildAccount({ status: AccountStatus.Draft });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);

    await expect(
      validatePostingAccount({ tenantId: 1n, accountUuid: account.uuid }, deps),
    ).rejects.toThrow(AccountNotActiveError);
  });

  it("throws AccountNotActiveError when the Account is Inactive", async () => {
    const deps = buildDeps();
    const account = buildAccount({ status: AccountStatus.Inactive });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);

    await expect(
      validatePostingAccount({ tenantId: 1n, accountUuid: account.uuid }, deps),
    ).rejects.toThrow(AccountNotActiveError);
  });

  it("throws AccountNotPostableError when the Account is a Summary Account", async () => {
    const deps = buildDeps();
    const account = buildAccount({ status: AccountStatus.Active, isPostingAccount: false });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);

    await expect(
      validatePostingAccount({ tenantId: 1n, accountUuid: account.uuid }, deps),
    ).rejects.toThrow(AccountNotPostableError);
  });

  it("returns the Account when Active and a Posting Account", async () => {
    const deps = buildDeps();
    const account = buildAccount({ status: AccountStatus.Active, isPostingAccount: true });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);

    const result = await validatePostingAccount({ tenantId: 1n, accountUuid: account.uuid }, deps);

    expect(result).toBe(account);
  });
});
