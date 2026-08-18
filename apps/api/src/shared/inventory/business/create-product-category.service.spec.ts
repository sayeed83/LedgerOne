import { createProductCategory, CreateProductCategoryDeps, CreateProductCategoryInput } from "./create-product-category.service";
import { ProductCategoryNotFoundError, DuplicateProductCategoryNameError } from "../domain/errors/inventory.errors";
import { buildProductCategory, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): CreateProductCategoryDeps {
  return { repository: createFakeInventoryRepository() };
}

function buildInput(overrides: Partial<CreateProductCategoryInput> = {}): CreateProductCategoryInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    name: "Hardware",
    ...overrides,
  };
}

describe("createProductCategory", () => {
  it("throws DuplicateProductCategoryNameError when a root-level Product Category with the same name already exists for the Company", async () => {
    const deps = buildDeps();
    (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([
      buildProductCategory({ name: "Hardware", parentProductCategoryId: null }),
    ]);

    await expect(createProductCategory(buildInput(), deps)).rejects.toThrow(DuplicateProductCategoryNameError);
    expect(deps.repository.createProductCategory).not.toHaveBeenCalled();
  });

  it("does not treat a same-named Category under a different parent as a duplicate", async () => {
    const deps = buildDeps();
    (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([
      buildProductCategory({ name: "Hardware", parentProductCategoryId: 9n }),
    ]);
    (deps.repository.createProductCategory as jest.Mock).mockResolvedValue(buildProductCategory());

    await createProductCategory(buildInput({ createdBy: 5n }), deps);

    expect(deps.repository.createProductCategory).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      name: "Hardware",
      parentProductCategoryId: null,
      defaultTaxGroupUuid: null,
      createdBy: 5n,
    });
  });

  it("creates the Product Category when no sibling shares its name", async () => {
    const deps = buildDeps();
    (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([
      buildProductCategory({ name: "Fasteners", parentProductCategoryId: null }),
    ]);
    (deps.repository.createProductCategory as jest.Mock).mockResolvedValue(buildProductCategory());

    await createProductCategory(buildInput({ defaultTaxGroupUuid: "00000000-0000-0000-0000-000000000900" }), deps);

    expect(deps.repository.createProductCategory).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      name: "Hardware",
      parentProductCategoryId: null,
      defaultTaxGroupUuid: "00000000-0000-0000-0000-000000000900",
      createdBy: null,
    });
  });

  it("throws ProductCategoryNotFoundError when the parent Product Category does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      createProductCategory(buildInput({ parentProductCategoryUuid: "00000000-0000-0000-0000-000000000601" }), deps),
    ).rejects.toThrow(ProductCategoryNotFoundError);
    expect(deps.repository.createProductCategory).not.toHaveBeenCalled();
    expect(deps.repository.listProductCategories).not.toHaveBeenCalled();
  });

  it("throws DuplicateProductCategoryNameError when a sibling under the same resolved parent shares its name", async () => {
    const deps = buildDeps();
    const parent = buildProductCategory({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(parent);
    (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([
      buildProductCategory({ name: "Fasteners", parentProductCategoryId: 2n }),
    ]);

    await expect(
      createProductCategory(buildInput({ name: "Fasteners", parentProductCategoryUuid: parent.uuid }), deps),
    ).rejects.toThrow(DuplicateProductCategoryNameError);
    expect(deps.repository.createProductCategory).not.toHaveBeenCalled();
  });

  it("creates the Product Category under the resolved parent when no sibling shares its name", async () => {
    const deps = buildDeps();
    const parent = buildProductCategory({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(parent);
    (deps.repository.listProductCategories as jest.Mock).mockResolvedValue([]);
    (deps.repository.createProductCategory as jest.Mock).mockResolvedValue(buildProductCategory());

    await createProductCategory(buildInput({ name: "Fasteners", parentProductCategoryUuid: parent.uuid }), deps);

    expect(deps.repository.createProductCategory).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      name: "Fasteners",
      parentProductCategoryId: 2n,
      defaultTaxGroupUuid: null,
      createdBy: null,
    });
  });
});
