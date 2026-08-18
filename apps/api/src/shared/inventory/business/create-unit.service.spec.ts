import { createUnit, CreateUnitDeps, CreateUnitInput } from "./create-unit.service";
import { UnitNotFoundError, InvalidUnitConversionFactorValueError } from "../domain/errors/inventory.errors";
import { buildUnit, createFakeInventoryRepository } from "./test-support/fixtures";

function buildDeps(): CreateUnitDeps {
  return { repository: createFakeInventoryRepository() };
}

function buildInput(overrides: Partial<CreateUnitInput> = {}): CreateUnitInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    name: "Pieces",
    symbol: "Pcs",
    ...overrides,
  };
}

describe("createUnit", () => {
  it("creates a base Unit (no baseUnitUuid, no conversionFactor)", async () => {
    const deps = buildDeps();
    (deps.repository.createUnit as jest.Mock).mockResolvedValue(buildUnit());

    await createUnit(buildInput({ createdBy: 5n }), deps);

    expect(deps.repository.createUnit).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      name: "Pieces",
      symbol: "Pcs",
      baseUnitId: null,
      conversionFactor: null,
      createdBy: 5n,
    });
    expect(deps.repository.findUnitByUuid).not.toHaveBeenCalled();
  });

  it("throws UnitNotFoundError when the supplied base Unit does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      createUnit(
        buildInput({ name: "Box of 100", symbol: "Box", baseUnitUuid: "00000000-0000-0000-0000-000000000601" }),
        deps,
      ),
    ).rejects.toThrow(UnitNotFoundError);
    expect(deps.repository.createUnit).not.toHaveBeenCalled();
  });

  it("throws InvalidUnitConversionFactorValueError when conversionFactor is zero", async () => {
    const deps = buildDeps();
    const baseUnit = buildUnit({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(baseUnit);

    await expect(
      createUnit(
        buildInput({ baseUnitUuid: baseUnit.uuid, conversionFactor: "0" }),
        deps,
      ),
    ).rejects.toThrow(InvalidUnitConversionFactorValueError);
    expect(deps.repository.createUnit).not.toHaveBeenCalled();
  });

  it("throws InvalidUnitConversionFactorValueError when conversionFactor is negative", async () => {
    const deps = buildDeps();
    const baseUnit = buildUnit({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(baseUnit);

    await expect(
      createUnit(buildInput({ baseUnitUuid: baseUnit.uuid, conversionFactor: "-5" }), deps),
    ).rejects.toThrow(InvalidUnitConversionFactorValueError);
    expect(deps.repository.createUnit).not.toHaveBeenCalled();
  });

  it("throws InvalidUnitConversionFactorValueError when conversionFactor is not numeric", async () => {
    const deps = buildDeps();
    const baseUnit = buildUnit({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(baseUnit);

    await expect(
      createUnit(buildInput({ baseUnitUuid: baseUnit.uuid, conversionFactor: "abc" }), deps),
    ).rejects.toThrow(InvalidUnitConversionFactorValueError);
    expect(deps.repository.createUnit).not.toHaveBeenCalled();
  });

  it("creates an alternate Unit with a resolved base Unit and a positive conversionFactor", async () => {
    const deps = buildDeps();
    const baseUnit = buildUnit({ id: 2n, uuid: "00000000-0000-0000-0000-000000000601" });
    (deps.repository.findUnitByUuid as jest.Mock).mockResolvedValue(baseUnit);
    (deps.repository.createUnit as jest.Mock).mockResolvedValue(buildUnit());

    await createUnit(
      buildInput({
        name: "Box of 100",
        symbol: "Box",
        baseUnitUuid: baseUnit.uuid,
        conversionFactor: "100",
      }),
      deps,
    );

    expect(deps.repository.createUnit).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      name: "Box of 100",
      symbol: "Box",
      baseUnitId: 2n,
      conversionFactor: "100",
      createdBy: null,
    });
  });
});
