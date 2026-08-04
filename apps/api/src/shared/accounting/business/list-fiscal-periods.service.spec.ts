import { listFiscalPeriods, ListFiscalPeriodsDeps } from "./list-fiscal-periods.service";
import { FinancialYearNotFoundError } from "../domain/errors/accounting.errors";
import { buildFinancialYear, buildFiscalPeriod, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ListFiscalPeriodsDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("listFiscalPeriods", () => {
  it("lists every Fiscal Period for the Tenant when no Financial Year is given", async () => {
    const deps = buildDeps();
    const periods = [buildFiscalPeriod()];
    (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue(periods);

    const result = await listFiscalPeriods({ tenantId: 1n }, deps);

    expect(deps.repository.listFiscalPeriods).toHaveBeenCalledWith(1n);
    expect(result).toBe(periods);
  });

  it("throws FinancialYearNotFoundError when the given Financial Year does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      listFiscalPeriods({ tenantId: 1n, financialYearUuid: "missing-uuid" }, deps),
    ).rejects.toThrow(FinancialYearNotFoundError);
    expect(deps.repository.listFiscalPeriods).not.toHaveBeenCalled();
  });

  it("resolves the Financial Year and lists only its Fiscal Periods", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear({ id: 10n, uuid: "00000000-0000-0000-0000-000000000001" });
    const periods = [buildFiscalPeriod({ financialYearId: 10n })];
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
    (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue(periods);

    const result = await listFiscalPeriods({ tenantId: 1n, financialYearUuid: financialYear.uuid }, deps);

    expect(deps.repository.listFiscalPeriods).toHaveBeenCalledWith(1n, 10n);
    expect(result).toBe(periods);
  });
});
