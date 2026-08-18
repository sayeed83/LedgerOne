import { listBaseUnits, ListBaseUnitsDeps } from "./list-base-units.service";
import { buildUnit, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): ListBaseUnitsDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("listBaseUnits", () => {
  it("passes tenantId and companyUuid through to the repository (cross-company isolation)", async () => {
    const deps = buildDeps();
    const baseUnits = [buildUnit({ baseUnitId: null })];
    (deps.repository.listBaseUnits as jest.Mock).mockResolvedValue(baseUnits);

    const result = await listBaseUnits({ tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" }, deps);

    expect(deps.repository.listBaseUnits).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000100");
    expect(result).toBe(baseUnits);
  });

  it("does not call listUnitsByCompany — base-unit filtering is the Repository's own concern", async () => {
    const deps = buildDeps();
    (deps.repository.listBaseUnits as jest.Mock).mockResolvedValue([]);

    await listBaseUnits({ tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" }, deps);

    expect(deps.repository.listUnitsByCompany).not.toHaveBeenCalled();
  });
});
