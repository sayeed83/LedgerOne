import { getCustomer, GetCustomerDeps } from "./get-customer.service";
import { CustomerNotFoundError } from "../domain/errors/sales.errors";
import { buildCustomer, createFakeSalesRepository } from "./test-support/fixtures";

function buildDeps(): GetCustomerDeps {
  return { repository: createFakeSalesRepository() };
}

describe("getCustomer", () => {
  it("throws CustomerNotFoundError when the Customer does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findCustomerByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      getCustomer({ tenantId: 1n, customerUuid: "00000000-0000-0000-0000-000000000600" }, deps),
    ).rejects.toThrow(CustomerNotFoundError);
  });

  it("returns the Customer when found", async () => {
    const deps = buildDeps();
    const customer = buildCustomer();
    (deps.repository.findCustomerByUuid as jest.Mock).mockResolvedValue(customer);

    const result = await getCustomer({ tenantId: 1n, customerUuid: customer.uuid }, deps);

    expect(result).toBe(customer);
    expect(deps.repository.findCustomerByUuid).toHaveBeenCalledWith(1n, customer.uuid);
  });
});
