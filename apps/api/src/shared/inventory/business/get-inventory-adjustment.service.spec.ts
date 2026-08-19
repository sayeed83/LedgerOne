import { getInventoryAdjustment, GetInventoryAdjustmentDeps } from "./get-inventory-adjustment.service";
import { InventoryAdjustmentNotFoundError } from "../domain/errors/inventory.errors";
import { buildInventoryAdjustment, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): GetInventoryAdjustmentDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("getInventoryAdjustment", () => {
  it("throws InventoryAdjustmentNotFoundError when the Inventory Adjustment does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findInventoryAdjustmentByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      getInventoryAdjustment(
        { tenantId: 1n, inventoryAdjustmentUuid: "00000000-0000-0000-0000-000000000900" },
        deps,
      ),
    ).rejects.toThrow(InventoryAdjustmentNotFoundError);
  });

  it("returns the Inventory Adjustment when found", async () => {
    const deps = buildDeps();
    const inventoryAdjustment = buildInventoryAdjustment();
    (deps.repository.findInventoryAdjustmentByUuid as jest.Mock).mockResolvedValue(inventoryAdjustment);

    const result = await getInventoryAdjustment(
      { tenantId: 1n, inventoryAdjustmentUuid: inventoryAdjustment.uuid },
      deps,
    );

    expect(result).toBe(inventoryAdjustment);
    expect(deps.repository.findInventoryAdjustmentByUuid).toHaveBeenCalledWith(1n, inventoryAdjustment.uuid);
  });
});
