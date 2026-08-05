import { getAccount, GetAccountDeps } from "./get-account.service";
import { AccountNotFoundError } from "../domain/errors/accounting.errors";
import { buildAccount, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): GetAccountDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("getAccount", () => {
  it("throws AccountNotFoundError when the Account does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      getAccount({ tenantId: 1n, accountUuid: "00000000-0000-0000-0000-000000000700" }, deps),
    ).rejects.toThrow(AccountNotFoundError);
  });

  it("returns the Account when found", async () => {
    const deps = buildDeps();
    const account = buildAccount();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);

    const result = await getAccount({ tenantId: 1n, accountUuid: account.uuid }, deps);

    expect(result).toBe(account);
  });
});
