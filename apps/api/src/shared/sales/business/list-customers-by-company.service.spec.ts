import { listCustomersByCompany, ListCustomersByCompanyDeps } from "./list-customers-by-company.service";
import { buildCustomer, createFakeSalesRepository } from "./test-support/fixtures";

function buildDeps(): ListCustomersByCompanyDeps {
  return { repository: createFakeSalesRepository() };
}

describe("listCustomersByCompany", () => {
  it("passes tenantId and companyUuid through to the repository (cross-company isolation)", async () => {
    const deps = buildDeps();
    const customers = [buildCustomer()];
    (deps.repository.listCustomersByCompany as jest.Mock).mockResolvedValue(customers);

    const result = await listCustomersByCompany(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" },
      deps,
    );

    expect(deps.repository.listCustomersByCompany).toHaveBeenCalledWith(1n, "00000000-0000-0000-0000-000000000100");
    expect(result).toBe(customers);
  });

  it("does not merge results across two different companies — each call is independently scoped", async () => {
    const deps = buildDeps();
    const companyACustomers = [buildCustomer({ companyUuid: "00000000-0000-0000-0000-000000000100" })];
    const companyBCustomers = [buildCustomer({ companyUuid: "00000000-0000-0000-0000-000000000200" })];
    (deps.repository.listCustomersByCompany as jest.Mock).mockImplementation(
      async (_tenantId: bigint, companyUuid: string) =>
        companyUuid === "00000000-0000-0000-0000-000000000100" ? companyACustomers : companyBCustomers,
    );

    const resultA = await listCustomersByCompany(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100" },
      deps,
    );
    const resultB = await listCustomersByCompany(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000200" },
      deps,
    );

    expect(resultA).toBe(companyACustomers);
    expect(resultB).toBe(companyBCustomers);
    expect(resultA).not.toBe(resultB);
  });
});
