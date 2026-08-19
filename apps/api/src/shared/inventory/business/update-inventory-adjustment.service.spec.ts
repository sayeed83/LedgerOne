import { updateInventoryAdjustment, UpdateInventoryAdjustmentDeps } from "./update-inventory-adjustment.service";
import { InventoryAdjustmentNotFoundError } from "../domain/errors/inventory.errors";
import { buildInventoryAdjustment, createFakeInventoryRepository } from "./test-support/fixtures";
import { AdjustmentType } from "../domain/enums/adjustment-type.enum";

function buildDeps(): UpdateInventoryAdjustmentDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("updateInventoryAdjustment", () => {
  it("throws InventoryAdjustmentNotFoundError when the Inventory Adjustment does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findInventoryAdjustmentByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateInventoryAdjustment(
        {
          tenantId: 1n,
          inventoryAdjustmentUuid: "00000000-0000-0000-0000-000000000900",
          reason: "Revised reason",
        },
        deps,
      ),
    ).rejects.toThrow(InventoryAdjustmentNotFoundError);
    expect(deps.repository.updateInventoryAdjustment).not.toHaveBeenCalled();
  });

  it("updates the Inventory Adjustment's editable fields and returns the repository's result", async () => {
    const deps = buildDeps();
    const inventoryAdjustment = buildInventoryAdjustment({ uuid: "00000000-0000-0000-0000-000000000900" });
    (deps.repository.findInventoryAdjustmentByUuid as jest.Mock).mockResolvedValue(inventoryAdjustment);
    const updated = buildInventoryAdjustment({
      uuid: inventoryAdjustment.uuid,
      reason: "Damage during transit",
    });
    (deps.repository.updateInventoryAdjustment as jest.Mock).mockResolvedValue(updated);

    const result = await updateInventoryAdjustment(
      {
        tenantId: 1n,
        inventoryAdjustmentUuid: inventoryAdjustment.uuid,
        adjustmentType: AdjustmentType.Decrease,
        quantity: "2.500000",
        reason: "Damage during transit",
        remarks: "Boxes crushed in transit",
        updatedBy: 7n,
      },
      deps,
    );

    expect(deps.repository.updateInventoryAdjustment).toHaveBeenCalledWith(1n, inventoryAdjustment.uuid, {
      adjustmentType: AdjustmentType.Decrease,
      quantity: "2.500000",
      reason: "Damage during transit",
      remarks: "Boxes crushed in transit",
      updatedBy: 7n,
    });
    expect(result).toBe(updated);
  });
});
