import { updateUnit, UpdateUnitDeps } from "./update-unit.service";
import { UnitNotFoundError, InvalidUnitConversionFactorValueError } from "../domain/errors/inventory.errors";
import { buildUnit, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): UpdateUnitDeps {
  return { repository: createFakeInventoryRepository() };
}

describe("updateUnit", () => {
  it("throws UnitNotFoundError when the Unit does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateUnit({ tenantId: 1n, unitUuid: "00000000-0000-0000-0000-000000000600", name: "Revised" }, deps),
    ).rejects.toThrow(UnitNotFoundError);
    expect(deps.repository.updateUnit).not.toHaveBeenCalled();
  });

  it("does not resolve a base Unit when baseUnitUuid is not supplied", async () => {
    const deps = buildDeps();
    const unit = buildUnit({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(unit);
    (deps.repository.updateUnit as jest.Mock).mockResolvedValue(unit);

    await updateUnit({ tenantId: 1n, unitUuid: unit.uuid, name: "Renamed" }, deps);

    expect(deps.repository.findUnitByUuid).toHaveBeenCalledTimes(1);
    expect(deps.repository.updateUnit).toHaveBeenCalledWith(1n, unit.uuid, {
      name: "Renamed",
      symbol: undefined,
      baseUnitId: undefined,
      conversionFactor: undefined,
      updatedBy: null,
    });
  });

  it("clears the base Unit when baseUnitUuid is explicitly null", async () => {
    const deps = buildDeps();
    const unit = buildUnit({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(unit);
    (deps.repository.updateUnit as jest.Mock).mockResolvedValue(unit);

    await updateUnit({ tenantId: 1n, unitUuid: unit.uuid, baseUnitUuid: null }, deps);

    expect(deps.repository.updateUnit).toHaveBeenCalledWith(1n, unit.uuid, {
      name: undefined,
      symbol: undefined,
      baseUnitId: null,
      conversionFactor: undefined,
      updatedBy: null,
    });
  });

  it("throws UnitNotFoundError when the new base Unit does not exist", async () => {
    const deps = buildDeps();
    const unit = buildUnit({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findUnitByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) =>
      uuid === unit.uuid ? unit : null,
    );

    await expect(
      updateUnit(
        { tenantId: 1n, unitUuid: unit.uuid, baseUnitUuid: "00000000-0000-0000-0000-000000000601" },
        deps,
      ),
    ).rejects.toThrow(UnitNotFoundError);
    expect(deps.repository.updateUnit).not.toHaveBeenCalled();
  });

  it("throws InvalidUnitConversionFactorValueError when the revised conversionFactor is not positive", async () => {
    const deps = buildDeps();
    const unit = buildUnit({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(unit);

    await expect(
      updateUnit({ tenantId: 1n, unitUuid: unit.uuid, conversionFactor: "0" }, deps),
    ).rejects.toThrow(InvalidUnitConversionFactorValueError);
    expect(deps.repository.updateUnit).not.toHaveBeenCalled();
  });

  it("does not validate conversionFactor when it is explicitly cleared to null", async () => {
    const deps = buildDeps();
    const unit = buildUnit({ uuid: "00000000-0000-0000-0000-000000000600" });
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(unit);
    (deps.repository.updateUnit as jest.Mock).mockResolvedValue(unit);

    await updateUnit({ tenantId: 1n, unitUuid: unit.uuid, conversionFactor: null }, deps);

    expect(deps.repository.updateUnit).toHaveBeenCalledWith(1n, unit.uuid, {
      name: undefined,
      symbol: undefined,
      baseUnitId: undefined,
      conversionFactor: null,
      updatedBy: null,
    });
  });

  it("updates the Unit with a resolved base Unit and a valid conversionFactor", async () => {
    const deps = buildDeps();
    const unit = buildUnit({ uuid: "00000000-0000-0000-0000-000000000600" });
    const baseUnit = buildUnit({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    (deps.repository.findUnitByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) => {
      if (uuid === unit.uuid) return unit;
      if (uuid === baseUnit.uuid) return baseUnit;
      return null;
    });
    const updated = buildUnit({ uuid: unit.uuid, name: "Box of 100" });
    (deps.repository.updateUnit as jest.Mock).mockResolvedValue(updated);

    const result = await updateUnit(
      {
        tenantId: 1n,
        unitUuid: unit.uuid,
        name: "Box of 100",
        symbol: "Box",
        baseUnitUuid: baseUnit.uuid,
        conversionFactor: "100",
        updatedBy: 7n,
      },
      deps,
    );

    expect(deps.repository.updateUnit).toHaveBeenCalledWith(1n, unit.uuid, {
      name: "Box of 100",
      symbol: "Box",
      baseUnitId: 2n,
      conversionFactor: "100",
      updatedBy: 7n,
    });
    expect(result).toBe(updated);
  });
});
