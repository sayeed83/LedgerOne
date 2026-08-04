import { validateFinancialYearOpen, ValidateFinancialYearOpenDeps } from "./validate-financial-year-open.service";
import { FinancialYearNotFoundError, FinancialYearNotOpenError } from "../domain/errors/accounting.errors";
import { FinancialYearStatus } from "../domain/enums/financial-year-status.enum";
import { buildFinancialYear, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ValidateFinancialYearOpenDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("validateFinancialYearOpen", () => {
  it("throws FinancialYearNotFoundError when the Financial Year does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      validateFinancialYearOpen({ tenantId: 1n, financialYearUuid: "missing-uuid" }, deps),
    ).rejects.toThrow(FinancialYearNotFoundError);
  });

  it("returns the Financial Year when it is Open", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear({ status: FinancialYearStatus.Open });
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);

    const result = await validateFinancialYearOpen({ tenantId: 1n, financialYearUuid: financialYear.uuid }, deps);

    expect(result).toBe(financialYear);
  });

  it.each([FinancialYearStatus.Future, FinancialYearStatus.Closing, FinancialYearStatus.Closed, FinancialYearStatus.Reopened])(
    "throws FinancialYearNotOpenError when the status is %s",
    async (status) => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({ status });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);

      await expect(
        validateFinancialYearOpen({ tenantId: 1n, financialYearUuid: financialYear.uuid }, deps),
      ).rejects.toThrow(FinancialYearNotOpenError);
    },
  );
});
