import { getAccountGroup, GetAccountGroupDeps } from "./get-account-group.service";
import { AccountGroupNotFoundError } from "../domain/errors/accounting.errors";
import { buildAccountGroup, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): GetAccountGroupDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("getAccountGroup", () => {
  it("throws AccountGroupNotFoundError when the Account Group does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      getAccountGroup({ tenantId: 1n, accountGroupUuid: "00000000-0000-0000-0000-000000000600" }, deps),
    ).rejects.toThrow(AccountGroupNotFoundError);
  });

  it("returns the Account Group when found", async () => {
    const deps = buildDeps();
    const accountGroup = buildAccountGroup();
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(accountGroup);

    const result = await getAccountGroup({ tenantId: 1n, accountGroupUuid: accountGroup.uuid }, deps);

    expect(result).toBe(accountGroup);
  });
});
