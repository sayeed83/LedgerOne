import { closeFinancialYear, CloseFinancialYearDeps } from "./close-financial-year.service";
import { FinancialYearNotFoundError, InvalidFinancialYearStatusTransitionError } from "../domain/errors/accounting.errors";
import { FinancialYearStatus } from "../domain/enums/financial-year-status.enum";
import { buildFinancialYear, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): CloseFinancialYearDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("closeFinancialYear", () => {
  it("throws FinancialYearNotFoundError when the Financial Year does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

    await expect(closeFinancialYear({ tenantId: 1n, financialYearUuid: "missing-uuid" }, deps)).rejects.toThrow(
      FinancialYearNotFoundError,
    );
    expect(deps.repository.closeFinancialYear).not.toHaveBeenCalled();
  });

  it.each([FinancialYearStatus.Open, FinancialYearStatus.Closing, FinancialYearStatus.Reopened])(
    "closes a Financial Year that is %s",
    async (status) => {
      const deps = buildDeps();
      const financialYear = buildFinancialYear({ status });
      (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
      (deps.repository.closeFinancialYear as jest.Mock).mockResolvedValue(
        buildFinancialYear({ status: FinancialYearStatus.Closed }),
      );

      const result = await closeFinancialYear({ tenantId: 1n, financialYearUuid: financialYear.uuid, updatedBy: 7n }, deps);

      expect(deps.repository.closeFinancialYear).toHaveBeenCalledWith(1n, financialYear.uuid, 7n);
      expect(result.status).toBe(FinancialYearStatus.Closed);
    },
  );

  it("rejects closing a Future Financial Year", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear({ status: FinancialYearStatus.Future });
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);

    await expect(
      closeFinancialYear({ tenantId: 1n, financialYearUuid: financialYear.uuid }, deps),
    ).rejects.toThrow(InvalidFinancialYearStatusTransitionError);
    expect(deps.repository.closeFinancialYear).not.toHaveBeenCalled();
  });
});
