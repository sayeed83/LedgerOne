import {
  listReorderLevelsByCompany,
  ListReorderLevelsByCompanyDeps,
} from "./list-reorder-levels-by-company.service";
import { buildReorderLevel, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): ListReorderLevelsByCompanyDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("listReorderLevelsByCompany", () => {
  it("passes tenantId and companyUuid through to the repository", async () => {
    const deps = buildDeps();
    const reorderLevels = [buildReorderLevel()];
    (deps.repository.listReorderLevelsByCompany as jest.Mock).mockResolvedValue(reorderLevels);

    const result = await listReorderLevelsByCompany(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" },
      deps,
    );

    expect(deps.repository.listReorderLevelsByCompany).toHaveBeenCalledWith(
      1n,
      "00000000-0000-0000-0000-000000000100",
    );
    expect(result).toBe(reorderLevels);
  });

  it("does not merge results across two different Companies — each call is independently scoped (company isolation)", async () => {
    const deps = buildDeps();
    const companyAReorderLevels = [buildReorderLevel({ companyUuid: "00000000-0000-0000-0000-000000000100" })];
    const companyBReorderLevels = [buildReorderLevel({ companyUuid: "00000000-0000-0000-0000-000000000101" })];
    (deps.repository.listReorderLevelsByCompany as jest.Mock).mockImplementation(
      async (_tenantId: bigint, companyUuid: string) =>
        companyUuid === "00000000-0000-0000-0000-000000000100" ? companyAReorderLevels : companyBReorderLevels,
    );

    const resultA = await listReorderLevelsByCompany(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" },
      deps,
    );
    const resultB = await listReorderLevelsByCompany(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000101" },
      deps,
    );

    expect(resultA).toBe(companyAReorderLevels);
    expect(resultB).toBe(companyBReorderLevels);
    expect(resultA).not.toBe(resultB);
  });
});
