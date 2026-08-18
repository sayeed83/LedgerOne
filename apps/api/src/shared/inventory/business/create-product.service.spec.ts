import { createProduct, CreateProductDeps, CreateProductInput } from "./create-product.service";
import {
  ProductCategoryNotFoundError,
  UnitNotFoundError,
  DuplicateProductCodeError,
} from "../domain/errors/inventory.errors";
import { buildProduct, buildProductCategory, buildUnit, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): CreateProductDeps {
  return { repository: createFakeInventoryRepository() };
}

function buildInput(overrides: Partial<CreateProductInput> = {}): CreateProductInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    productCode: "SB-M8-40",
    name: "Steel Bolt M8x40",
    productCategoryUuid: "00000000-0000-0000-0000-000000000601",
    isStocked: true,
    ...overrides,
  };
}

describe("createProduct", () => {
  it("throws ProductCategoryNotFoundError when the Product Category does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(null);

    await expect(createProduct(buildInput(), deps)).rejects.toThrow(ProductCategoryNotFoundError);
    expect(deps.repository.createProduct).not.toHaveBeenCalled();
    expect(deps.repository.findProductByCode).not.toHaveBeenCalled();
  });

  it("throws UnitNotFoundError when the supplied Unit does not exist", async () => {
    const deps = buildDeps();
    const productCategory = buildProductCategory({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      createProduct(
        buildInput({ productCategoryUuid: productCategory.uuid, unitUuid: "00000000-0000-0000-0000-000000000701" }),
        deps,
      ),
    ).rejects.toThrow(UnitNotFoundError);
    expect(deps.repository.createProduct).not.toHaveBeenCalled();
  });

  it("throws DuplicateProductCodeError when another Product in the Company already uses the code", async () => {
    const deps = buildDeps();
    const productCategory = buildProductCategory({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
    (deps.repository.findProductByCode as jest.Mock).mockResolvedValue(buildProduct());

    await expect(
      createProduct(buildInput({ productCategoryUuid: productCategory.uuid }), deps),
    ).rejects.toThrow(DuplicateProductCodeError);
    expect(deps.repository.createProduct).not.toHaveBeenCalled();
  });

  it("does not resolve a Unit when unitUuid is not supplied", async () => {
    const deps = buildDeps();
    const productCategory = buildProductCategory({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
    (deps.repository.findProductByCode as jest.Mock).mockResolvedValue(null);
    (deps.repository.createProduct as jest.Mock).mockResolvedValue(buildProduct());

    await createProduct(buildInput({ productCategoryUuid: productCategory.uuid, createdBy: 5n }), deps);

    expect(deps.repository.findUnitByUuid).not.toHaveBeenCalled();
    expect(deps.repository.createProduct).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      productCode: "SB-M8-40",
      name: "Steel Bolt M8x40",
      description: null,
      productCategoryId: 2n,
      unitId: null,
      isStocked: true,
      status: undefined,
      createdBy: 5n,
    });
  });

  it("creates the Product with a resolved Product Category and Unit", async () => {
    const deps = buildDeps();
    const productCategory = buildProductCategory({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    const unit = buildUnit({ id: 3n, uuid: "00000000-0000-0000-0000-000000000701" });
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(unit);
    (deps.repository.findProductByCode as jest.Mock).mockResolvedValue(null);
    (deps.repository.createProduct as jest.Mock).mockResolvedValue(buildProduct());

    await createProduct(
      buildInput({
        productCategoryUuid: productCategory.uuid,
        unitUuid: unit.uuid,
        description: "Zinc-plated hex bolt",
      }),
      deps,
    );

    expect(deps.repository.createProduct).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      productCode: "SB-M8-40",
      name: "Steel Bolt M8x40",
      description: "Zinc-plated hex bolt",
      productCategoryId: 2n,
      unitId: 3n,
      isStocked: true,
      status: undefined,
      createdBy: null,
    });
  });
});
