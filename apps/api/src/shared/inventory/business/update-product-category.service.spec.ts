import { updateProductCategory, UpdateProductCategoryDeps } from "./update-product-category.service";
import { ProductCategoryNotFoundError, DuplicateProductCategoryNameError } from "../domain/errors/inventory.errors";
import { buildProductCategory, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): UpdateProductCategoryDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("updateProductCategory", () => {
  it("throws ProductCategoryNotFoundError when the Product Category does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateProductCategory(
        { tenantId: 1n, productCategoryUuid: "00000000-0000-0000-0000-000000000600", name: "Revised" },
        deps,
      ),
    ).rejects.toThrow(ProductCategoryNotFoundError);
    expect(deps.repository.updateProductCategory).not.toHaveBeenCalled();
  });

  it("throws DuplicateProductCategoryNameError when renaming to a name another Category at the same (existing) hierarchy level already uses", async () => {
    const deps = buildDeps();
    const productCategory = buildProductCategory({
      uuid: "00000000-0000-0000-0000-000000000600",
      name: "Hardware",
      parentProductCategoryId: null,
    });
    const other = buildProductCategory({
      uuid: "00000000-0000-0000-0000-000000000601",
      name: "Fasteners",
      parentProductCategoryId: null,
    });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
    (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([productCategory, other]);

    await expect(
      updateProductCategory({ tenantId: 1n, productCategoryUuid: productCategory.uuid, name: "Fasteners" }, deps),
    ).rejects.toThrow(DuplicateProductCategoryNameError);
    expect(deps.repository.updateProductCategory).not.toHaveBeenCalled();
  });

  it("does not treat a same-named Category under a different parent as a duplicate", async () => {
    const deps = buildDeps();
    const productCategory = buildProductCategory({
      uuid: "00000000-0000-0000-0000-000000000600",
      name: "Hardware",
      parentProductCategoryId: null,
    });
    const other = buildProductCategory({
      uuid: "00000000-0000-0000-0000-000000000601",
      name: "Fasteners",
      parentProductCategoryId: 9n,
    });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
    (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([productCategory, other]);
    (deps.repository.updateProductCategory as jest.Mock).mockResolvedValue(productCategory);

    await updateProductCategory({ tenantId: 1n, productCategoryUuid: productCategory.uuid, name: "Fasteners" }, deps);

    expect(deps.repository.updateProductCategory).toHaveBeenCalled();
  });

  it("does not re-check duplicates when the name is unchanged", async () => {
    const deps = buildDeps();
    const productCategory = buildProductCategory({ uuid: "00000000-0000-0000-0000-000000000600", name: "Hardware" });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
    (deps.repository.updateProductCategory as jest.Mock).mockResolvedValue(productCategory);

    await updateProductCategory({ tenantId: 1n, productCategoryUuid: productCategory.uuid, name: "Hardware" }, deps);

    expect(deps.repository.listProductCategories).not.toHaveBeenCalled();
    expect(deps.repository.updateProductCategory).toHaveBeenCalled();
  });

  it("throws ProductCategoryNotFoundError when the new parent Product Category does not exist", async () => {
    const deps = buildDeps();
    const productCategory = buildProductCategory({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) =>
      uuid === productCategory.uuid ? productCategory : null,
    );

    await expect(
      updateProductCategory(
        {
          tenantId: 1n,
          productCategoryUuid: productCategory.uuid,
          parentProductCategoryUuid: "00000000-0000-0000-0000-000000000601",
        },
        deps,
      ),
    ).rejects.toThrow(ProductCategoryNotFoundError);
    expect(deps.repository.updateProductCategory).not.toHaveBeenCalled();
  });

  it("throws DuplicateProductCategoryNameError when a sibling under the new resolved parent shares the effective name", async () => {
    const deps = buildDeps();
    const productCategory = buildProductCategory({
      uuid: "00000000-0000-0000-0000-000000000600",
      name: "Fasteners",
      parentProductCategoryId: null,
    });
    const parent = buildProductCategory({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    const siblingUnderParent = buildProductCategory({
      uuid: "00000000-0000-0000-0000-000000000602",
      name: "Fasteners",
      parentProductCategoryId: 2n,
    });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) => {
      if (uuid === productCategory.uuid) return productCategory;
      if (uuid === parent.uuid) return parent;
      return null;
    });
    (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([productCategory, siblingUnderParent]);

    await expect(
      updateProductCategory(
        { tenantId: 1n, productCategoryUuid: productCategory.uuid, parentProductCategoryUuid: parent.uuid },
        deps,
      ),
    ).rejects.toThrow(DuplicateProductCategoryNameError);
    expect(deps.repository.updateProductCategory).not.toHaveBeenCalled();
  });

  it("clears the parent when parentProductCategoryUuid is explicitly null", async () => {
    const deps = buildDeps();
    const productCategory = buildProductCategory({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
    (deps.repository.updateProductCategory as jest.Mock).mockResolvedValue(productCategory);

    await updateProductCategory(
      { tenantId: 1n, productCategoryUuid: productCategory.uuid, parentProductCategoryUuid: null },
      deps,
    );

    expect(deps.repository.updateProductCategory).toHaveBeenCalledWith(1n, productCategory.uuid, {
      name: undefined,
      parentProductCategoryId: null,
      defaultTaxGroupUuid: undefined,
      updatedBy: null,
    });
  });

  it("updates the Product Category when the new parent has no conflicting sibling", async () => {
    const deps = buildDeps();
    const productCategory = buildProductCategory({
      uuid: "00000000-0000-0000-0000-000000000600",
      name: "Fasteners",
    });
    const parent = buildProductCategory({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) => {
      if (uuid === productCategory.uuid) return productCategory;
      if (uuid === parent.uuid) return parent;
      return null;
    });
    (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([productCategory]);
    (deps.repository.updateProductCategory as jest.Mock).mockResolvedValue(productCategory);

    await updateProductCategory(
      {
        tenantId: 1n,
        productCategoryUuid: productCategory.uuid,
        name: "Renamed",
        parentProductCategoryUuid: parent.uuid,
        defaultTaxGroupUuid: "00000000-0000-0000-0000-000000000900",
        updatedBy: 7n,
      },
      deps,
    );

    expect(deps.repository.updateProductCategory).toHaveBeenCalledWith(1n, productCategory.uuid, {
      name: "Renamed",
      parentProductCategoryId: 2n,
      defaultTaxGroupUuid: "00000000-0000-0000-0000-000000000900",
      updatedBy: 7n,
    });
  });
});
