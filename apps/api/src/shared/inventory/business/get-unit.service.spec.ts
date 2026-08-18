import { getUnit, GetUnitDeps } from "./get-unit.service";
import { UnitNotFoundError } from "../domain/errors/inventory.errors";
import { buildUnit, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): GetUnitDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("getUnit", () => {
  it("throws UnitNotFoundError when the Unit does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getUnit({ tenantId: 1n, unitUuid: "00000000-0000-0000-0000-000000000600" }, deps)).rejects.toThrow(
      UnitNotFoundError,
    );
  });

  it("returns the Unit when found", async () => {
    const deps = buildDeps();
    const unit = buildUnit();
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(unit);

    const result = await getUnit({ tenantId: 1n, unitUuid: unit.uuid }, deps);

    expect(result).toBe(unit);
    expect(deps.repository.findUnitByUuid).toHaveBeenCalledWith(1n, unit.uuid);
  });
});
