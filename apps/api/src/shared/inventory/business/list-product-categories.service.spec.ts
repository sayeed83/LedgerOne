import { listProductCategories, ListProductCategoriesDeps } from "./list-product-categories.service";
import { buildProductCategory, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): ListProductCategoriesDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("listProductCategories", () => {
  it("lists tenant-wide when no companyUuid filter is given", async () => {
    const deps = buildDeps();
    (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([]);

    await listProductCategories({ tenantId: 1n }, deps);

    expect(deps.repository.listProductCategories).toHaveBeenCalledWith(1n, undefined);
  });

  it("passes companyUuid through as a filter", async () => {
    const deps = buildDeps();
    const categories = [buildProductCategory()];
    (deps.repository.listProductCategories as jest.Mock).mockResolvedValue(categories);

    const result = await listProductCategories(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" },
      deps,
    );

    expect(deps.repository.listProductCategories).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000100");
    expect(result).toBe(categories);
  });
});
