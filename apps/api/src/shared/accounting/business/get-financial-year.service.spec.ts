import { getFinancialYear, GetFinancialYearDeps } from "./get-financial-year.service";
import { FinancialYearNotFoundError } from "../domain/errors/accounting.errors";
import { buildFinancialYear, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): GetFinancialYearDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("getFinancialYear", () => {
  it("throws FinancialYearNotFoundError when the Financial Year does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getFinancialYear({ tenantId: 1n, financialYearUuid: "missing-uuid" }, deps)).rejects.toThrow(
      FinancialYearNotFoundError,
    );
  });

  it("returns the Financial Year when found", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear();
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);

    const result = await getFinancialYear({ tenantId: 1n, financialYearUuid: financialYear.uuid }, deps);

    expect(deps.repository.findFinancialYearByUuid).toHaveBeenCalledWith(1n, financialYear.uuid);
    expect(result).toBe(financialYear);
  });
});
