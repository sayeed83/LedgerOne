import { createFiscalPeriod, CreateFiscalPeriodDeps, CreateFiscalPeriodInput } from "./create-fiscal-period.service";
import { FinancialYearNotFoundError, FiscalPeriodOverlapError } from "../domain/errors/accounting.errors";
import { buildFinancialYear, buildFiscalPeriod, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): CreateFiscalPeriodDeps {
  return { repository: createFakeAccountingRepository() };
}

function buildInput(overrides: Partial<CreateFiscalPeriodInput> = {}): CreateFiscalPeriodInput {
  return {
    tenantId: 1n,
    financialYearUuid: "00000000-0000-0000-0000-000000000001",
    startDate: new Date("2026-04-01T00:00:00.000Z"),
    endDate: new Date("2026-04-30T00:00:00.000Z"),
    ...overrides,
  };
}

describe("createFiscalPeriod", () => {
  it("throws FinancialYearNotFoundError when the parent Financial Year does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

    await expect(createFiscalPeriod(buildInput(), deps)).rejects.toThrow(FinancialYearNotFoundError);
    expect(deps.repository.createFiscalPeriod).not.toHaveBeenCalled();
  });

  it("throws FiscalPeriodOverlapError when the new range overlaps an existing Fiscal Period in the same Financial Year", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear({ id: 10n, uuid: "00000000-0000-0000-0000-000000000001" });
    const existing = buildFiscalPeriod({
      financialYearId: 10n,
      startDate: new Date("2026-04-15T00:00:00.000Z"),
      endDate: new Date("2026-05-15T00:00:00.000Z"),
    });
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
    (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([existing]);

    await expect(createFiscalPeriod(buildInput(), deps)).rejects.toThrow(FiscalPeriodOverlapError);
    expect(deps.repository.createFiscalPeriod).not.toHaveBeenCalled();
  });

  it("creates the Fiscal Period when the range does not overlap any existing one in the Financial Year", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear({ id: 10n, uuid: "00000000-0000-0000-0000-000000000001", companyUuid: "00000000-0000-0000-0000-000000000100" });
    const existing = buildFiscalPeriod({
      financialYearId: 10n,
      startDate: new Date("2026-05-01T00:00:00.000Z"),
      endDate: new Date("2026-05-31T00:00:00.000Z"),
    });
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
    (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([existing]);
    (deps.repository.createFiscalPeriod as jest.Mock).mockResolvedValue(buildFiscalPeriod());

    await createFiscalPeriod(buildInput({ createdBy: 5n }), deps);

    expect(deps.repository.listFiscalPeriods).toHaveBeenCalledWith(1n, 10n);
    expect(deps.repository.createFiscalPeriod).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      financialYearId: 10n,
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T00:00:00.000Z"),
      createdBy: 5n,
    });
  });

  it("creates the Fiscal Period when no other Fiscal Period exists in the Financial Year", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear({ id: 10n, uuid: "00000000-0000-0000-0000-000000000001" });
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
    (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([]);
    (deps.repository.createFiscalPeriod as jest.Mock).mockResolvedValue(buildFiscalPeriod());

    await createFiscalPeriod(buildInput(), deps);

    expect(deps.repository.createFiscalPeriod).toHaveBeenCalled();
  });
});
