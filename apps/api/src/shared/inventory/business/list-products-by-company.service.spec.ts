import { listProductsByCompany, ListProductsByCompanyDeps } from "./list-products-by-company.service";
import { buildProduct, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): ListProductsByCompanyDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("listProductsByCompany", () => {
  it("passes tenantId and companyUuid through to the repository (cross-company isolation)", async () => {
    const deps = buildDeps();
    const products = [buildProduct()];
    (deps.repository.listProductsByCompany as jest.Mock).mockResolvedValue(products);

    const result = await listProductsByCompany(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" },
      deps,
    );

    expect(deps.repository.listProductsByCompany).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000100");
    expect(result).toBe(products);
  });

  it("does not merge results across two different companies — each call is independently scoped", async () => {
    const deps = buildDeps();
    const companyAProducts = [buildProduct({ companyUuid: "00000000-0000-0000-0000-000000000100" })];
    const companyBProducts = [buildProduct({ companyUuid: "00000000-0000-0000-0000-000000000200" })];
    (deps.repository.listProductsByCompany as jest.Mock).mockImplementation(
      async (_tenantId: bigint, companyUuid: string) =>
        companyUuid === "00000000-0000-0000-0000-000000000100" ? companyAProducts : companyBProducts,
    );

    const resultA = await listProductsByCompany(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" },
      deps,
    );
    const resultB = await listProductsByCompany(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );

    expect(resultA).toBe(companyAProducts);
    expect(resultB).toBe(companyBProducts);
    expect(resultA).not.toBe(resultB);
  });
});
