import { updateProduct, UpdateProductDeps } from "./update-product.service";
import {
  ProductNotFoundError,
  ProductCategoryNotFoundError,
  UnitNotFoundError,
  DuplicateProductCodeError,
} from "../domain/errors/inventory.errors";
import { buildProduct, buildProductCategory, buildUnit, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): UpdateProductDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("updateProduct", () => {
  it("throws ProductNotFoundError when the Product does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateProduct({ tenantId: 1n, productUuid: "00000000-0000-0000-0000-000000000600", name: "Revised" }, deps),
    ).rejects.toThrow(ProductNotFoundError);
    expect(deps.repository.updateProduct).not.toHaveBeenCalled();
  });

  it("does not resolve a Product Category when productCategoryUuid is not supplied", async () => {
    const deps = buildDeps();
    const product = buildProduct({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);
    (deps.repository.updateProduct as jest.Mock).mockResolvedValue(product);

    await updateProduct({ tenantId: 1n, productUuid: product.uuid, name: "Renamed" }, deps);

    expect(deps.repository.findProductCategoryByUuid).not.toHaveBeenCalled();
    expect(deps.repository.updateProduct).toHaveBeenCalledWith(1n, product.uuid, {
      productCode: undefined,
      name: "Renamed",
      description: undefined,
      productCategoryId: undefined,
      unitId: undefined,
      isStocked: undefined,
      status: undefined,
      updatedBy: null,
    });
  });

  it("throws ProductCategoryNotFoundError when the new Product Category does not exist", async () => {
    const deps = buildDeps();
    const product = buildProduct({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateProduct(
        {
          tenantId: 1n,
          productUuid: product.uuid,
          productCategoryUuid: "00000000-0000-0000-0000-000000000601",
        },
        deps,
      ),
    ).rejects.toThrow(ProductCategoryNotFoundError);
    expect(deps.repository.updateProduct).not.toHaveBeenCalled();
  });

  it("clears the Unit when unitUuid is explicitly null", async () => {
    const deps = buildDeps();
    const product = buildProduct({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);
    (deps.repository.updateProduct as jest.Mock).mockResolvedValue(product);

    await updateProduct({ tenantId: 1n, productUuid: product.uuid, unitUuid: null }, deps);

    expect(deps.repository.findUnitByUuid).not.toHaveBeenCalled();
    expect(deps.repository.updateProduct).toHaveBeenCalledWith(1n, product.uuid, {
      productCode: undefined,
      name: undefined,
      description: undefined,
      productCategoryId: undefined,
      unitId: null,
      isStocked: undefined,
      status: undefined,
      updatedBy: null,
    });
  });

  it("throws UnitNotFoundError when the new Unit does not exist", async () => {
    const deps = buildDeps();
    const product = buildProduct({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateProduct(
        { tenantId: 1n, productUuid: product.uuid, unitUuid: "00000000-0000-0000-0000-000000000701" },
        deps,
      ),
    ).rejects.toThrow(UnitNotFoundError);
    expect(deps.repository.updateProduct).not.toHaveBeenCalled();
  });

  it("does not re-check code uniqueness when productCode is unchanged", async () => {
    const deps = buildDeps();
    const product = buildProduct({ uuid: "00000000-0000-0000-0000-000000000600", productCode: "SB-M8-40" });
    (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);
    (deps.repository.updateProduct as jest.Mock).mockResolvedValue(product);

    await updateProduct({ tenantId: 1n, productUuid: product.uuid, productCode: "SB-M8-40" }, deps);

    expect(deps.repository.findProductByCode).not.toHaveBeenCalled();
    expect(deps.repository.updateProduct).toHaveBeenCalled();
  });

  it("throws DuplicateProductCodeError when renaming the code to one another Product in the Company already uses", async () => {
    const deps = buildDeps();
    const product = buildProduct({ uuid: "00000000-0000-0000-0000-000000000600", productCode: "SB-M8-40" });
    const other = buildProduct({ uuid: "00000000-0000-0000-0000-000000000602", productCode: "SB-M10-50" });
    (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);
    (deps.repository.findProductByCode as jest.Mock).mockResolvedValue(other);

    await expect(
      updateProduct({ tenantId: 1n, productUuid: product.uuid, productCode: "SB-M10-50" }, deps),
    ).rejects.toThrow(DuplicateProductCodeError);
    expect(deps.repository.updateProduct).not.toHaveBeenCalled();
  });

  it("updates the Product with a resolved Product Category and Unit and a non-conflicting new code", async () => {
    const deps = buildDeps();
    const product = buildProduct({ uuid: "00000000-0000-0000-0000-000000000600", productCode: "SB-M8-40" });
    const productCategory = buildProductCategory({ id: 4n, uuid: "00000000-0000-0000-0000-000000000601" });
    const unit = buildUnit({ id: 3n, uuid: "00000000-0000-0000-0000-000000000701" });
    (deps.repository.findProductByUuid as jest.Mock).mockResolvedValue(product);
    (deps.repository.findProductCategoryByUuid as jest.Mock).mockResolvedValue(productCategory);
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(unit);
    (deps.repository.findProductByCode as jest.Mock).mockResolvedValue(null);
    const updated = buildProduct({ uuid: product.uuid, name: "Renamed" });
    (deps.repository.updateProduct as jest.Mock).mockResolvedValue(updated);

    const result = await updateProduct(
      {
        tenantId: 1n,
        productUuid: product.uuid,
        productCode: "SB-M10-50",
        name: "Renamed",
        productCategoryUuid: productCategory.uuid,
        unitUuid: unit.uuid,
        updatedBy: 7n,
      },
      deps,
    );

    expect(deps.repository.updateProduct).toHaveBeenCalledWith(1n, product.uuid, {
      productCode: "SB-M10-50",
      name: "Renamed",
      description: undefined,
      productCategoryId: 4n,
      unitId: 3n,
      isStocked: undefined,
      status: undefined,
      updatedBy: 7n,
    });
    expect(result).toBe(updated);
  });
});
