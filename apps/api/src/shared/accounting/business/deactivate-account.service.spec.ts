import { deactivateAccount, DeactivateAccountDeps } from "./deactivate-account.service";
import { AccountNotFoundError, InvalidAccountStatusTransitionError } from "../domain/errors/accounting.errors";
import { AccountStatus } from "../domain/enums/account-status.enum";
import { buildAccount, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): DeactivateAccountDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("deactivateAccount", () => {
  it("throws AccountNotFoundError when the Account does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      deactivateAccount({ tenantId: 1n, accountUuid: "00000000-0000-0000-0000-000000000700" }, deps),
    ).rejects.toThrow(AccountNotFoundError);
    expect(deps.repository.deactivateAccount).not.toHaveBeenCalled();
  });

  it("deactivates an Active Account", async () => {
    const deps = buildDeps();
    const account = buildAccount({ status: AccountStatus.Active });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    (deps.repository.deactivateAccount as jest.Mock).mockResolvedValue(buildAccount({ status: AccountStatus.Inactive }));

    const result = await deactivateAccount({ tenantId: 1n, accountUuid: account.uuid, updatedBy: 7n }, deps);

    expect(deps.repository.deactivateAccount).toHaveBeenCalledWith(1n, account.uuid, 7n);
    expect(result.status).toBe(AccountStatus.Inactive);
  });

  it("rejects deactivating a Draft Account", async () => {
    const deps = buildDeps();
    const account = buildAccount({ status: AccountStatus.Draft });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);

    await expect(deactivateAccount({ tenantId: 1n, accountUuid: account.uuid }, deps)).rejects.toThrow(
      InvalidAccountStatusTransitionError,
    );
    expect(deps.repository.deactivateAccount).not.toHaveBeenCalled();
  });

  it("rejects deactivating an already-Inactive Account", async () => {
    const deps = buildDeps();
    const account = buildAccount({ status: AccountStatus.Inactive });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);

    await expect(deactivateAccount({ tenantId: 1n, accountUuid: account.uuid }, deps)).rejects.toThrow(
      InvalidAccountStatusTransitionError,
    );
    expect(deps.repository.deactivateAccount).not.toHaveBeenCalled();
  });
});
