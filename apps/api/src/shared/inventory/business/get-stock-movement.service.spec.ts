import { getStockMovement, GetStockMovementDeps } from "./get-stock-movement.service";
import { StockMovementNotFoundError } from "../domain/errors/inventory.errors";
import { buildStockMovement, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): GetStockMovementDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("getStockMovement", () => {
  it("throws StockMovementNotFoundError when the Stock Movement does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findStockMovementByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      getStockMovement({ tenantId: 1n, stockMovementUuid: "00000000-0000-0000-0000-000000000007" }, deps),
    ).rejects.toThrow(StockMovementNotFoundError);
  });

  it("returns the Stock Movement when found", async () => {
    const deps = buildDeps();
    const stockMovement = buildStockMovement();
    (deps.repository.findStockMovementByUuid as jest.Mock).mockResolvedValue(stockMovement);

    const result = await getStockMovement({ tenantId: 1n, stockMovementUuid: stockMovement.uuid }, deps);

    expect(result).toBe(stockMovement);
    expect(deps.repository.findStockMovementByUuid).toHaveBeenCalledWith(1n, stockMovement.uuid);
  });
});
