import { updateFinancialYear, UpdateFinancialYearDeps } from "./update-financial-year.service";
import { FinancialYearNotFoundError, FinancialYearOverlapError } from "../domain/errors/accounting.errors";
import { buildFinancialYear, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): UpdateFinancialYearDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("updateFinancialYear", () => {
  it("throws FinancialYearNotFoundError when the Financial Year does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateFinancialYear({ tenantId: 1n, financialYearUuid: "missing-uuid", startDate: new Date() }, deps),
    ).rejects.toThrow(FinancialYearNotFoundError);
    expect(deps.repository.updateFinancialYear).not.toHaveBeenCalled();
  });

  it("throws FinancialYearOverlapError when the revised range overlaps another Financial Year for the same Company", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear({
      uuid: "00000000-0000-0000-0000-000000000001",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2027-03-31T00:00:00.000Z"),
    });
    const other = buildFinancialYear({
      uuid: "00000000-0000-0000-0000-000000000099",
      startDate: new Date("2027-04-01T00:00:00.000Z"),
      endDate: new Date("2028-03-31T00:00:00.000Z"),
    });
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
    (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([financialYear, other]);

    await expect(
      updateFinancialYear(
        { tenantId: 1n, financialYearUuid: financialYear.uuid, endDate: new Date("2027-04-15T00:00:00.000Z") },
        deps,
      ),
    ).rejects.toThrow(FinancialYearOverlapError);
    expect(deps.repository.updateFinancialYear).not.toHaveBeenCalled();
  });

  it("excludes the Financial Year being revised from its own overlap check", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear({
      uuid: "00000000-0000-0000-0000-000000000001",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2027-03-31T00:00:00.000Z"),
    });
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
    (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([financialYear]);
    (deps.repository.updateFinancialYear as jest.Mock).mockResolvedValue(
      buildFinancialYear({ endDate: new Date("2027-03-30T00:00:00.000Z") }),
    );

    await updateFinancialYear(
      { tenantId: 1n, financialYearUuid: financialYear.uuid, endDate: new Date("2027-03-30T00:00:00.000Z"), updatedBy: 3n },
      deps,
    );

    expect(deps.repository.updateFinancialYear).toHaveBeenCalledWith(1n, financialYear.uuid, {
      startDate: undefined,
      endDate: new Date("2027-03-30T00:00:00.000Z"),
      updatedBy: 3n,
    });
  });

  it("skips the overlap check when neither date is being changed", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear();
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
    (deps.repository.updateFinancialYear as jest.Mock).mockResolvedValue(financialYear);

    await updateFinancialYear({ tenantId: 1n, financialYearUuid: financialYear.uuid, updatedBy: null }, deps);

    expect(deps.repository.listFinancialYears).not.toHaveBeenCalled();
    expect(deps.repository.updateFinancialYear).toHaveBeenCalledWith(1n, financialYear.uuid, {
      startDate: undefined,
      endDate: undefined,
      updatedBy: null,
    });
  });
});
