import { createFinancialYear, CreateFinancialYearDeps, CreateFinancialYearInput } from "./create-financial-year.service";
import { FinancialYearOverlapError } from "../domain/errors/accounting.errors";
import { buildFinancialYear, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): CreateFinancialYearDeps {
  return { repository: createFakeAccountingRepository() };
}

function buildInput(overrides: Partial<CreateFinancialYearInput> = {}): CreateFinancialYearInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    startDate: new Date("2026-04-01T00:00:00.000Z"),
    endDate: new Date("2027-03-31T00:00:00.000Z"),
    ...overrides,
  };
}

describe("createFinancialYear", () => {
  it("throws FinancialYearOverlapError when the new range overlaps an existing Financial Year for the same Company", async () => {
    const deps = buildDeps();
    const existing = buildFinancialYear({
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-12-31T00:00:00.000Z"),
    });
    (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([existing]);

    await expect(createFinancialYear(buildInput(), deps)).rejects.toThrow(FinancialYearOverlapError);
    expect(deps.repository.createFinancialYear).not.toHaveBeenCalled();
  });

  it("creates the Financial Year when the range does not overlap any existing one for the Company", async () => {
    const deps = buildDeps();
    const existing = buildFinancialYear({
      startDate: new Date("2025-04-01T00:00:00.000Z"),
      endDate: new Date("2026-03-31T00:00:00.000Z"),
    });
    (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([existing]);
    (deps.repository.createFinancialYear as jest.Mock).mockResolvedValue(buildFinancialYear());

    await createFinancialYear(buildInput(), deps);

    expect(deps.repository.listFinancialYears).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000100");
    expect(deps.repository.createFinancialYear).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2027-03-31T00:00:00.000Z"),
      createdBy: null,
    });
  });

  it("creates the Financial Year when no other Financial Year exists for the Company", async () => {
    const deps = buildDeps();
    (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([]);
    (deps.repository.createFinancialYear as jest.Mock).mockResolvedValue(buildFinancialYear());

    await createFinancialYear(buildInput({ createdBy: 5n }), deps);

    expect(deps.repository.createFinancialYear).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2027-03-31T00:00:00.000Z"),
      createdBy: 5n,
    });
  });
});
