import { listAccounts, ListAccountsDeps } from "./list-accounts.service";
import { AccountGroupNotFoundError } from "../domain/errors/accounting.errors";
import { AccountStatus } from "../domain/enums/account-status.enum";
import { buildAccount, buildAccountGroup, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ListAccountsDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("listAccounts", () => {
  it("lists tenant-wide when no filters are given", async () => {
    const deps = buildDeps();
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue([]);

    await listAccounts({ tenantId: 1n }, deps);

    expect(deps.repository.findAccountGroupByUuid).not.toHaveBeenCalled();
    expect(deps.repository.listAccounts).toHaveBeenCalledWith(1n, undefined, undefined, undefined);
  });

  it("resolves accountGroupUuid to its internal id before filtering", async () => {
    const deps = buildDeps();
    const accountGroup = buildAccountGroup({ id: 10n, uuid: "00000000-0000-0000-0000-000000000600" });
    const accounts = [buildAccount({ accountGroupId: 10n })];
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(accountGroup);
    (deps.repository.listAccounts as jest.Mock).mockResolvedValue(accounts);

    const result = await listAccounts(
      { tenantId: 1n, accountGroupUuid: accountGroup.uuid, status: AccountStatus.Active },
      deps,
    );

    expect(deps.repository.listAccounts).toHaveBeenCalledWith(1n, undefined, 10n, AccountStatus.Active);
    expect(result).toBe(accounts);
  });

  it("throws AccountGroupNotFoundError when the filtering Account Group does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountGroupByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      listAccounts({ tenantId: 1n, accountGroupUuid: "00000000-0000-0000-0000-000000000600" }, deps),
    ).rejects.toThrow(AccountGroupNotFoundError);
    expect(deps.repository.listAccounts).not.toHaveBeenCalled();
  });
});
