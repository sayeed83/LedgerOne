import {
  createInventoryAdjustment,
  CreateInventoryAdjustmentDeps,
  CreateInventoryAdjustmentInput,
} from "./create-inventory-adjustment.service";
import { buildInventoryAdjustment, createFakeInventoryRepository } from "./test-support/fixtures";
import { AdjustmentType } from "../domain/enums/adjustment-type.enum";

function buildDeps(): CreateInventoryAdjustmentDeps {
  return { repository: createFakeInventoryRepository() };
}

function buildInput(overrides: Partial<CreateInventoryAdjustmentInput> = {}): CreateInventoryAdjustmentInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    warehouseUuid: "00000000-0000-0000-0000-000000000200",
    productId: 1n,
    adjustmentType: AdjustmentType.Increase,
    quantity: "1.000000",
    reason: "Physical count variance",
    ...overrides,
  };
}

describe("createInventoryAdjustment", () => {
  it("creates the Inventory Adjustment and returns the repository's result", async () => {
    const deps = buildDeps();
    const created = buildInventoryAdjustment();
    (deps.repository.createInventoryAdjustment as jest.Mock).mockResolvedValue(created);

    const result = await createInventoryAdjustment(buildInput(), deps);

    expect(result).toBe(created);
  });

  it("passes the expected payload through to the repository", async () => {
    const deps = buildDeps();
    (deps.repository.createInventoryAdjustment as jest.Mock).mockResolvedValue(buildInventoryAdjustment());

    await createInventoryAdjustment(
      buildInput({ remarks: "Confirmed by warehouse supervisor", createdBy: 5n }),
      deps,
    );

    expect(deps.repository.createInventoryAdjustment).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      warehouseUuid: "00000000-0000-0000-0000-000000000200",
      productId: 1n,
      adjustmentType: AdjustmentType.Increase,
      quantity: "1.000000",
      reason: "Physical count variance",
      remarks: "Confirmed by warehouse supervisor",
      createdBy: 5n,
    });
  });

  it("defaults remarks/createdBy to null when omitted", async () => {
    const deps = buildDeps();
    (deps.repository.createInventoryAdjustment as jest.Mock).mockResolvedValue(buildInventoryAdjustment());

    await createInventoryAdjustment(buildInput(), deps);

    expect(deps.repository.createInventoryAdjustment).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      warehouseUuid: "00000000-0000-0000-0000-000000000200",
      productId: 1n,
      adjustmentType: AdjustmentType.Increase,
      quantity: "1.000000",
      reason: "Physical count variance",
      remarks: null,
      createdBy: null,
    });
  });
});
