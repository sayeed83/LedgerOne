import { getStock, GetStockDeps } from "./get-stock.service";
import { StockNotFoundError } from "../domain/errors/inventory.errors";
import { buildStock, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): GetStockDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("getStock", () => {
  it("throws StockNotFoundError when the Stock does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      getStock({ tenantId: 1n, stockUuid: "00000000-0000-0000-0000-000000000005" }, deps),
    ).rejects.toThrow(StockNotFoundError);
  });

  it("returns the Stock when found", async () => {
    const deps = buildDeps();
    const stock = buildStock();
    (deps.repository.findStockByUuid as jest.Mock).mockResolvedValue(stock);

    const result = await getStock({ tenantId: 1n, stockUuid: stock.uuid }, deps);

    expect(result).toBe(stock);
    expect(deps.repository.findStockByUuid).toHaveBeenCalledWith(1n, stock.uuid);
  });
});
