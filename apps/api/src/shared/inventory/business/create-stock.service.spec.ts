import { createStock, CreateStockDeps, CreateStockInput } from "./create-stock.service";
import { StockAlreadyExistsError } from "../domain/errors/inventory.errors";
import { buildStock, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): CreateStockDeps {
  return { repository: createFakeInventoryRepository() };
}

function buildInput(overrides: Partial<CreateStockInput> = {}): CreateStockInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    warehouseUuid: "00000000-0000-0000-0000-000000000200",
    productId: 1n,
    ...overrides,
  };
}

describe("createStock", () => {
  it("throws StockAlreadyExistsError when a Stock already exists for the Warehouse/Product pair", async () => {
    const deps = buildDeps();
    (deps.repository.findStockByWarehouseAndProduct as jest.Mock).mockResolvedValue(buildStock());

    await expect(createStock(buildInput(), deps)).rejects.toThrow(StockAlreadyExistsError);
    expect(deps.repository.createStock).not.toHaveBeenCalled();
  });

  it("creates the Stock when no Stock exists for the Warehouse/Product pair", async () => {
    const deps = buildDeps();
    (deps.repository.findStockByWarehouseAndProduct as jest.Mock).mockResolvedValue(null);
    const created = buildStock();
    (deps.repository.createStock as jest.Mock).mockResolvedValue(created);

    const result = await createStock(
      buildInput({
        quantityOnHand: "10.000000",
        quantityReserved: "2.000000",
        quantityAvailable: "8.000000",
        createdBy: 5n,
      }),
      deps,
    );

    expect(deps.repository.findStockByWarehouseAndProduct).toHaveBeenCalledWith(
      1n,
      "00000000-0000-0000-0000-000000000200",
      1n,
    );
    expect(deps.repository.createStock).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      warehouseUuid: "00000000-0000-0000-0000-000000000200",
      productId: 1n,
      quantityOnHand: "10.000000",
      quantityReserved: "2.000000",
      quantityAvailable: "8.000000",
      createdBy: 5n,
    });
    expect(result).toBe(created);
  });

  it("defaults createdBy to null when not supplied", async () => {
    const deps = buildDeps();
    (deps.repository.findStockByWarehouseAndProduct as jest.Mock).mockResolvedValue(null);
    (deps.repository.createStock as jest.Mock).mockResolvedValue(buildStock());

    await createStock(buildInput(), deps);

    expect(deps.repository.createStock).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      warehouseUuid: "00000000-0000-0000-0000-000000000200",
      productId: 1n,
      quantityOnHand: undefined,
      quantityReserved: undefined,
      quantityAvailable: undefined,
      createdBy: null,
    });
  });
});
