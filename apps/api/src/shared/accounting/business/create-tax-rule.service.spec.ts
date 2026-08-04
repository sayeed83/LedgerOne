import { createTaxRule, CreateTaxRuleDeps, CreateTaxRuleInput } from "./create-tax-rule.service";
import {
  TaxGroupNotFoundError,
  InvalidTaxRateValueError,
  InvalidTaxRuleEffectiveDateRangeError,
  TaxRuleOverlapError,
} from "../domain/errors/accounting.errors";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { buildTaxGroup, buildTaxRule, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): CreateTaxRuleDeps {
  return { repository: createFakeAccountingRepository() };
}

function buildInput(overrides: Partial<CreateTaxRuleInput> = {}): CreateTaxRuleInput {
  return {
    tenantId: 1n,
    taxGroupUuid: "00000000-0000-0000-0000-000000000400",
    rate: DecimalValue.create("18.0000"),
    effectiveFrom: new Date("2026-04-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("createTaxRule", () => {
  it("throws TaxGroupNotFoundError when the parent Tax Group does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(null);

    await expect(createTaxRule(buildInput(), deps)).rejects.toThrow(TaxGroupNotFoundError);
    expect(deps.repository.createTaxRule).not.toHaveBeenCalled();
  });

  it("throws InvalidTaxRateValueError when the rate is negative", async () => {
    const deps = buildDeps();
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(buildTaxGroup({ id: 1n }));

    await expect(createTaxRule(buildInput({ rate: DecimalValue.create("-5") }), deps)).rejects.toThrow(
      InvalidTaxRateValueError,
    );
    expect(deps.repository.createTaxRule).not.toHaveBeenCalled();
  });

  it("allows a zero rate (Zero Rate Tax Group, 00_BUSINESS_RULES.md Ch.67.11)", async () => {
    const deps = buildDeps();
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(buildTaxGroup({ id: 1n }));
    (deps.repository.listTaxRules as jest.Mock).mockResolvedValue([]);
    (deps.repository.createTaxRule as jest.Mock).mockResolvedValue(buildTaxRule({ rate: DecimalValue.create("0") }));

    await createTaxRule(buildInput({ rate: DecimalValue.create("0") }), deps);

    expect(deps.repository.createTaxRule).toHaveBeenCalled();
  });

  it("throws InvalidTaxRuleEffectiveDateRangeError when effectiveTo is before effectiveFrom", async () => {
    const deps = buildDeps();
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(buildTaxGroup({ id: 1n }));

    await expect(
      createTaxRule(
        buildInput({
          effectiveFrom: new Date("2026-04-01T00:00:00.000Z"),
          effectiveTo: new Date("2026-03-01T00:00:00.000Z"),
        }),
        deps,
      ),
    ).rejects.toThrow(InvalidTaxRuleEffectiveDateRangeError);
    expect(deps.repository.createTaxRule).not.toHaveBeenCalled();
  });

  it("throws TaxRuleOverlapError when the new range overlaps an existing Tax Rule for the same Tax Group", async () => {
    const deps = buildDeps();
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(buildTaxGroup({ id: 1n, uuid: "00000000-0000-0000-0000-000000000400" }));
    (deps.repository.listTaxRules as jest.Mock).mockResolvedValue([
      buildTaxRule({
        taxGroupId: 1n,
        effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
        effectiveTo: new Date("2026-12-31T00:00:00.000Z"),
      }),
    ]);

    await expect(createTaxRule(buildInput({ effectiveFrom: new Date("2026-06-01T00:00:00.000Z") }), deps)).rejects.toThrow(
      TaxRuleOverlapError,
    );
    expect(deps.repository.createTaxRule).not.toHaveBeenCalled();
  });

  it("throws TaxRuleOverlapError when the new open-ended range overlaps an existing open-ended Tax Rule", async () => {
    const deps = buildDeps();
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(buildTaxGroup({ id: 1n }));
    (deps.repository.listTaxRules as jest.Mock).mockResolvedValue([
      buildTaxRule({ taxGroupId: 1n, effectiveFrom: new Date("2026-01-01T00:00:00.000Z"), effectiveTo: null }),
    ]);

    await expect(
      createTaxRule(buildInput({ effectiveFrom: new Date("2027-01-01T00:00:00.000Z"), effectiveTo: null }), deps),
    ).rejects.toThrow(TaxRuleOverlapError);
  });

  it("creates the Tax Rule when the range does not overlap any existing one for the Tax Group", async () => {
    const deps = buildDeps();
    const taxGroup = buildTaxGroup({ id: 1n, uuid: "00000000-0000-0000-0000-000000000400" });
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(taxGroup);
    (deps.repository.listTaxRules as jest.Mock).mockResolvedValue([
      buildTaxRule({
        taxGroupId: 1n,
        effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
        effectiveTo: new Date("2025-12-31T00:00:00.000Z"),
      }),
    ]);
    (deps.repository.createTaxRule as jest.Mock).mockResolvedValue(buildTaxRule());

    await createTaxRule(buildInput({ createdBy: 5n }), deps);

    expect(deps.repository.listTaxRules).toHaveBeenCalledWith(1n, 1n);
    expect(deps.repository.createTaxRule).toHaveBeenCalledWith(1n, {
      taxGroupId: 1n,
      rate: expect.anything(),
      effectiveFrom: new Date("2026-04-01T00:00:00.000Z"),
      effectiveTo: null,
      createdBy: 5n,
    });
  });

  it("creates the Tax Rule when no other Tax Rule exists yet for the Tax Group", async () => {
    const deps = buildDeps();
    (deps.repository.findTaxGroupByUuid as jest.Mock).mockResolvedValue(buildTaxGroup({ id: 1n }));
    (deps.repository.listTaxRules as jest.Mock).mockResolvedValue([]);
    (deps.repository.createTaxRule as jest.Mock).mockResolvedValue(buildTaxRule());

    await createTaxRule(buildInput(), deps);

    expect(deps.repository.createTaxRule).toHaveBeenCalled();
  });
});
