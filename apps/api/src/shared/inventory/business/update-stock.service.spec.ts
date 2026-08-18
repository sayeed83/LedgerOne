import { updateStock, UpdateStockDeps } from "./update-stock.service";
import { StockNotFoundError, StockAlreadyExistsError } from "../domain/errors/inventory.errors";
import { buildStock, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): UpdateStockDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("updateStock", () => {
  it("throws StockNotFoundError when the Stock does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateStock(
        { tenantId: 1n, stockUuid: "00000000-0000-0000-0000-000000000005", quantityOnHand: "5.000000" },
        deps,
      ),
    ).rejects.toThrow(StockNotFoundError);
    expect(deps.repository.updateStock).not.toHaveBeenCalled();
  });

  it("skips the Warehouse/Product uniqueness lookup when warehouseUuid and productId are unchanged", async () => {
    const deps = buildDeps();
    const stock = buildStock({
      uuid: "00000000-0000-0000-0000-000000000005",
      warehouseUuid: "00000000-0000-0000-0000-000000000200",
      productId: 1n,
    });
    (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(stock);
    (deps.repository.updateStock as jest.Mock).mockResolvedValue(stock);

    await updateStock(
      {
        tenantId: 1n,
        stockUuid: stock.uuid,
        warehouseUuid: stock.warehouseUuid,
        productId: stock.productId,
        quantityOnHand: "12.000000",
      },
      deps,
    );

    expect(deps.repository.findStockByWarehouseAndProduct).not.toHaveBeenCalled();
    expect(deps.repository.updateStock).toHaveBeenCalledWith(1n, stock.uuid, {
      quantityOnHand: "12.000000",
      quantityReserved: undefined,
      quantityAvailable: undefined,
      updatedBy: null,
    });
  });

  it("does not perform the uniqueness lookup when warehouseUuid/productId are not supplied at all", async () => {
    const deps = buildDeps();
    const stock = buildStock({ uuid: "00000000-0000-0000-0000-000000000005" });
    (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(stock);
    (deps.repository.updateStock as jest.Mock).mockResolvedValue(stock);

    await updateStock({ tenantId: 1n, stockUuid: stock.uuid, quantityReserved: "3.000000" }, deps);

    expect(deps.repository.findStockByWarehouseAndProduct).not.toHaveBeenCalled();
    expect(deps.repository.updateStock).toHaveBeenCalledWith(1n, stock.uuid, {
      quantityOnHand: undefined,
      quantityReserved: "3.000000",
      quantityAvailable: undefined,
      updatedBy: null,
    });
  });

  it("throws StockAlreadyExistsError when moving to a Warehouse/Product pair another Stock already occupies", async () => {
    const deps = buildDeps();
    const stock = buildStock({
      uuid: "00000000-0000-0000-0000-000000000005",
      warehouseUuid: "00000000-0000-0000-0000-000000000200",
      productId: 1n,
    });
    const other = buildStock({ uuid: "00000000-0000-0000-0000-000000000006", warehouseUuid: "00000000-0000-0000-0000-000000000300", productId: 2n });
    (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(stock);
    (deps.repository.findStockByWarehouseAndProduct as jest.Mock).mockResolvedValue(other);

    await expect(
      updateStock(
        {
          tenantId: 1n,
          stockUuid: stock.uuid,
          warehouseUuid: "00000000-0000-0000-0000-000000000300",
          productId: 2n,
        },
        deps,
      ),
    ).rejects.toThrow(StockAlreadyExistsError);
    expect(deps.repository.updateStock).not.toHaveBeenCalled();
  });

  it("updates the Stock when the new Warehouse/Product pair has no conflicting Stock", async () => {
    const deps = buildDeps();
    const stock = buildStock({
      uuid: "00000000-0000-0000-0000-000000000005",
      warehouseUuid: "00000000-0000-0000-0000-000000000200",
      productId: 1n,
    });
    (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(stock);
    (deps.repository.findStockByWarehouseAndProduct as jest.Mock).mockResolvedValue(null);
    const updated = buildStock({ uuid: stock.uuid, quantityOnHand: "20.000000" });
    (deps.repository.updateStock as jest.Mock).mockResolvedValue(updated);

    const result = await updateStock(
      {
        tenantId: 1n,
        stockUuid: stock.uuid,
        warehouseUuid: "00000000-0000-0000-0000-000000000300",
        productId: 2n,
        quantityOnHand: "20.000000",
        updatedBy: 7n,
      },
      deps,
    );

    expect(deps.repository.findStockByWarehouseAndProduct).toHaveBeenCalledWith(
      1n,
      "00000000-0000-0000-0000-000000000300",
      2n,
    );
    expect(deps.repository.updateStock).toHaveBeenCalledWith(1n, stock.uuid, {
      quantityOnHand: "20.000000",
      quantityReserved: undefined,
      quantityAvailable: undefined,
      updatedBy: 7n,
    });
    expect(result).toBe(updated);
  });

  it("does not treat finding the same Stock row itself as a conflict", async () => {
    const deps = buildDeps();
    const stock = buildStock({
      uuid: "00000000-0000-0000-0000-000000000005",
      warehouseUuid: "00000000-0000-0000-0000-000000000200",
      productId: 1n,
    });
    (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(stock);
    (deps.repository.findStockByWarehouseAndProduct as jest.Mock).mockResolvedValue(stock);
    (deps.repository.updateStock as jest.Mock).mockResolvedValue(stock);

    await updateStock(
      { tenantId: 1n, stockUuid: stock.uuid, warehouseUuid: stock.warehouseUuid, productId: 2n },
      deps,
    );

    expect(deps.repository.updateStock).toHaveBeenCalled();
  });
});
