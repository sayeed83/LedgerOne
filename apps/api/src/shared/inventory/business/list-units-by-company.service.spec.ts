import { listUnitsByCompany, ListUnitsByCompanyDeps } from "./list-units-by-company.service";
import { buildUnit, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): ListUnitsByCompanyDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("listUnitsByCompany", () => {
  it("passes tenantId and companyUuid through to the repository (cross-company isolation)", async () => {
    const deps = buildDeps();
    const units = [buildUnit()];
    (deps.repository.listUnitsByCompany as jest.Mock).mockResolvedValue(units);

    const result = await listUnitsByCompany(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" },
      deps,
    );

    expect(deps.repository.listUnitsByCompany).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000100");
    expect(result).toBe(units);
  });

  it("does not merge results across two different companies — each call is independently scoped", async () => {
    const deps = buildDeps();
    const companyAUnits = [buildUnit({ companyUuid: "00000000-0000-0000-0000-000000000100" })];
    const companyBUnits = [buildUnit({ companyUuid: "00000000-0000-0000-0000-000000000200" })];
    (deps.repository.listUnitsByCompany as jest.Mock).mockImplementation(
      async (_tenantId: bigint, companyUuid: string) =>
        companyUuid === "00000000-0000-0000-0000-000000000100" ? companyAUnits : companyBUnits,
    );

    const resultA = await listUnitsByCompany({ tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" }, deps);
    const resultB = await listUnitsByCompany({ tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000200" }, deps);

    expect(resultA).toBe(companyAUnits);
    expect(resultB).toBe(companyBUnits);
    expect(resultA).not.toBe(resultB);
  });
});
