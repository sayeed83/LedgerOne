import { reopenFinancialYear, ReopenFinancialYearDeps } from "./reopen-financial-year.service";
import { FinancialYearNotFoundError, InvalidFinancialYearStatusTransitionError } from "../domain/errors/accounting.errors";
import { FinancialYearStatus } from "../domain/enums/financial-year-status.enum";
import { buildFinancialYear, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ReopenFinancialYearDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("reopenFinancialYear", () => {
  it("throws FinancialYearNotFoundError when the Financial Year does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

    await expect(reopenFinancialYear({ tenantId: 1n, financialYearUuid: "missing-uuid" }, deps)).rejects.toThrow(
      FinancialYearNotFoundError,
    );
    expect(deps.repository.reopenFinancialYear).not.toHaveBeenCalled();
  });

  it("reopens a Closed Financial Year", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear({ status: FinancialYearStatus.Closed });
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
    (deps.repository.reopenFinancialYear as jest.Mock).mockResolvedValue(
      buildFinancialYear({ status: FinancialYearStatus.Reopened }),
    );

    const result = await reopenFinancialYear({ tenantId: 1n, financialYearUuid: financialYear.uuid, updatedBy: 7n }, deps);

    expect(deps.repository.reopenFinancialYear).toHaveBeenCalledWith(1n, financialYear.uuid, 7n);
    expect(result.status).toBe(FinancialYearStatus.Reopened);
  });

  it.each([FinancialYearStatus.Future, FinancialYearStatus.Open, FinancialYearStatus.Closing, FinancialYearStatus.Reopened])(
    "rejects reopening a Financial Year that is %s",
    async (status) => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({ status });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);

      await expect(
        reopenFinancialYear({ tenantId: 1n, financialYearUuid: financialYear.uuid }, deps),
      ).rejects.toThrow(InvalidFinancialYearStatusTransitionError);
      expect(deps.repository.reopenFinancialYear).not.toHaveBeenCalled();
    },
  );
});
