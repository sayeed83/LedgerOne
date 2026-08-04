import { listFinancialYears, ListFinancialYearsDeps } from "./list-financial-years.service";
import { buildFinancialYear, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ListFinancialYearsDeps {
  return { repository: createFakeAccountingRepository() };
}

describe("listFinancialYears", () => {
  it("returns the Financial Years for the given tenant", async () => {
    const deps = buildDeps();
    const years = [buildFinancialYear(), buildFinancialYear({ uuid: "00000000-0000-0000-0000-000000000099" })];
    (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue(years);

    const result = await listFinancialYears({ tenantId: 1n }, deps);

    expect(deps.repository.listFinancialYears).toHaveBeenCalledWith(1n, undefined);
    expect(result).toBe(years);
  });

  it("passes the companyUuid filter through when supplied", async () => {
    const deps = buildDeps();
    const years = [buildFinancialYear()];
    (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue(years);

    await listFinancialYears({ tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" }, deps);

    expect(deps.repository.listFinancialYears).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000100");
  });
});
