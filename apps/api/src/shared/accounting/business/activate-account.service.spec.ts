import { activateAccount, ActivateAccountDeps } from "./activate-account.service";
import { AccountNotFoundError, InvalidAccountStatusTransitionError } from "../domain/errors/accounting.errors";
import { AccountStatus } from "../domain/enums/account-status.enum";
import { buildAccount, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ActivateAccountDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("activateAccount", () => {
  it("throws AccountNotFoundError when the Account does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      activateAccount({ tenantId: 1n, accountUuid: "00000000-0000-0000-0000-000000000700" }, deps),
    ).rejects.toThrow(AccountNotFoundError);
    expect(deps.repository.activateAccount).not.toHaveBeenCalled();
  });

  it("activates a Draft Account", async () => {
    const deps = buildDeps();
    const account = buildAccount({ status: AccountStatus.Draft });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    (deps.repository.activateAccount as jest.Mock).mockResolvedValue(buildAccount({ status: AccountStatus.Active }));

    const result = await activateAccount({ tenantId: 1n, accountUuid: account.uuid, updatedBy: 7n }, deps);

    expect(deps.repository.activateAccount).toHaveBeenCalledWith(1n, account.uuid, 7n);
    expect(result.status).toBe(AccountStatus.Active);
  });

  it("activates an Inactive Account", async () => {
    const deps = buildDeps();
    const account = buildAccount({ status: AccountStatus.Inactive });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    (deps.repository.activateAccount as jest.Mock).mockResolvedValue(buildAccount({ status: AccountStatus.Active }));

    const result = await activateAccount({ tenantId: 1n, accountUuid: account.uuid }, deps);

    expect(result.status).toBe(AccountStatus.Active);
  });

  it("rejects activating an already-Active Account", async () => {
    const deps = buildDeps();
    const account = buildAccount({ status: AccountStatus.Active });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);

    await expect(activateAccount({ tenantId: 1n, accountUuid: account.uuid }, deps)).rejects.toThrow(
      InvalidAccountStatusTransitionError,
    );
    expect(deps.repository.activateAccount).not.toHaveBeenCalled();
  });
});
