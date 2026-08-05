import { listAccountGroups, ListAccountGroupsDeps } from "./list-account-groups.service";
import { buildAccountGroup, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ListAccountGroupsDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("listAccountGroups", () => {
  it("lists tenant-wide when no companyUuid filter is given", async () => {
    const deps = buildDeps();
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue([]);

    await listAccountGroups({ tenantId: 1n }, deps);

    expect(deps.repository.listAccountGroups).toHaveBeenCalledWith(1n, undefined);
  });

  it("passes companyUuid through as a filter", async () => {
    const deps = buildDeps();
    const groups = [buildAccountGroup()];
    (deps.repository.listAccountGroups as jest.Mock).mockResolvedValue(groups);

    const result = await listAccountGroups(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" },
      deps,
    );

    expect(deps.repository.listAccountGroups).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000100");
    expect(result).toBe(groups);
  });
});
