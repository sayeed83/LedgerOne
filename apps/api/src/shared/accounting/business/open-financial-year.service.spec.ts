import { openFinancialYear, OpenFinancialYearDeps } from "./open-financial-year.service";
import { FinancialYearNotFoundError, InvalidFinancialYearStatusTransitionError } from "../domain/errors/accounting.errors";
import { FinancialYearStatus } from "../domain/enums/financial-year-status.enum";
import { buildFinancialYear, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): OpenFinancialYearDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("openFinancialYear", () => {
  it("throws FinancialYearNotFoundError when the Financial Year does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(null);

    await expect(openFinancialYear({ tenantId: 1n, financialYearUuid: "missing-uuid" }, deps)).rejects.toThrow(
      FinancialYearNotFoundError,
    );
    expect(deps.repository.openFinancialYear).not.toHaveBeenCalled();
  });

  it("opens a Future Financial Year", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear({ status: FinancialYearStatus.Future });
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
    (deps.repository.openFinancialYear as jest.Mock).mockResolvedValue(
      buildFinancialYear({ status: FinancialYearStatus.Open }),
    );

    const result = await openFinancialYear({ tenantId: 1n, financialYearUuid: financialYear.uuid, updatedBy: 7n }, deps);

    expect(deps.repository.openFinancialYear).toHaveBeenCalledWith(1n, financialYear.uuid, 7n);
    expect(result.status).toBe(FinancialYearStatus.Open);
  });

  it("rejects opening an already-Open Financial Year", async () => {
    const deps = buildDeps();
    const financialYear = buildFinancialYear({ status: FinancialYearStatus.Open });
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);

    await expect(
      openFinancialYear({ tenantId: 1n, financialYearUuid: financialYear.uuid }, deps),
    ).rejects.toThrow(InvalidFinancialYearStatusTransitionError);
    expect(deps.repository.openFinancialYear).not.toHaveBeenCalled();
  });
});
