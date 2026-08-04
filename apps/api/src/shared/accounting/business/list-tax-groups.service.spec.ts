import { listTaxGroups, ListTaxGroupsDeps } from "./list-tax-groups.service";
import { buildTaxGroup, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ListTaxGroupsDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("listTaxGroups", () => {
  it("delegates to the repository with the given tenant and optional companyUuid filter", async () => {
    const deps = buildDeps();
    const groups = [buildTaxGroup()];
    (deps.repository.listTaxGroups as jest.Mock).mockResolvedValue(groups);

    const result = await listTaxGroups({ tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" }, deps);

    expect(deps.repository.listTaxGroups).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000100");
    expect(result).toBe(groups);
  });

  it("lists tenant-wide when no companyUuid filter is given", async () => {
    const deps = buildDeps();
    (deps.repository.listTaxGroups as jest.Mock).mockResolvedValue([]);

    await listTaxGroups({ tenantId: 1n }, deps);

    expect(deps.repository.listTaxGroups).toHaveBeenCalledWith(1n, undefined);
  });
});
