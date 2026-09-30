import { listCustomers, ListCustomersDeps } from "./list-customers.service";
import { buildCustomer, createFakeSalesRepository } from "./test-support/fixtures";

function buildDeps(): ListCustomersDeps {
  return { repository: createFakeSalesRepository() };
}

describe("listCustomers", () => {
  it("returns the customers for the given tenant", async () => {
    const deps = buildDeps();
    const customers = [buildCustomer(), buildCustomer({ uuid: "00000000-0000-0000-0000-000000000099" })];
    (deps.repository.listCustomers as jest.Mock).mockResolvedValue(customers);

    const result = await listCustomers({ tenantId: 1n }, deps);

    expect(deps.repository.listCustomers).toHaveBeenCalledWith(1n);
    expect(result).toBe(customers);
  });

  it("does not merge results across two different tenants — each call is independently scoped", async () => {
    const deps = buildDeps();
    const tenant1Customers = [buildCustomer({ tenantId: 1n })];
    const tenant2Customers = [buildCustomer({ tenantId: 2n })];
    (deps.repository.listCustomers as jest.Mock).mockImplementation(async (tenantId: bigint) =>
      tenantId === 1n ? tenant1Customers : tenant2Customers,
    );

    const result1 = await listCustomers({ tenantId: 1n }, deps);
    const result2 = await listCustomers({ tenantId: 2n }, deps);

    expect(result1).toBe(tenant1Customers);
    expect(result2).toBe(tenant2Customers);
    expect(result1).not.toBe(result2);
  });
});
