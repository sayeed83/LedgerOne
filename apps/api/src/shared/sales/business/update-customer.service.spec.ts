import { updateCustomer, UpdateCustomerDeps } from "./update-customer.service";
import { CustomerNotFoundError, CustomerAlreadyExistsError } from "../domain/errors/sales.errors";
import { buildCustomer, createFakeSalesRepository } from "./test-support/fixtures";

function buildDeps(): UpdateCustomerDeps {
  return { repository: createFakeSalesRepository() };
}

describe("updateCustomer", () => {
  it("throws CustomerNotFoundError when the Customer does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findCustomerByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateCustomer({ tenantId: 1n, customerUuid: "00000000-0000-0000-0000-000000000600", name: "Revised" }, deps),
    ).rejects.toThrow(CustomerNotFoundError);
    expect(deps.repository.updateCustomer).not.toHaveBeenCalled();
  });

  it("does not re-check name uniqueness when name is unchanged", async () => {
    const deps = buildDeps();
    const customer = buildCustomer({ uuid: "00000000-0000-0000-0000-000000000600", name: "Regional Hardware Store" });
    (deps.repository.findCustomerByUuid as jest.Mock).mockResolvedValue(customer);
    (deps.repository.updateCustomer as jest.Mock).mockResolvedValue(customer);

    await updateCustomer({ tenantId: 1n, customerUuid: customer.uuid, creditLimit: "75000.0000" }, deps);

    expect(deps.repository.findCustomerByName).not.toHaveBeenCalled();
    expect(deps.repository.updateCustomer).toHaveBeenCalled();
  });

  it("throws CustomerAlreadyExistsError when renaming to a name another Customer in the Company already uses", async () => {
    const deps = buildDeps();
    const customer = buildCustomer({ uuid: "00000000-0000-0000-0000-000000000600", name: "Regional Hardware Store" });
    const other = buildCustomer({ uuid: "00000000-0000-0000-0000-000000000602", name: "Metro Supplies" });
    (deps.repository.findCustomerByUuid as jest.Mock).mockResolvedValue(customer);
    (deps.repository.findCustomerByName as jest.Mock).mockResolvedValue(other);

    await expect(
      updateCustomer({ tenantId: 1n, customerUuid: customer.uuid, name: "Metro Supplies" }, deps),
    ).rejects.toThrow(CustomerAlreadyExistsError);
    expect(deps.repository.updateCustomer).not.toHaveBeenCalled();
  });

  it("updates the Customer with a non-conflicting new name", async () => {
    const deps = buildDeps();
    const customer = buildCustomer({ uuid: "00000000-0000-0000-0000-000000000600", name: "Regional Hardware Store" });
    (deps.repository.findCustomerByUuid as jest.Mock).mockResolvedValue(customer);
    (deps.repository.findCustomerByName as jest.Mock).mockResolvedValue(null);
    const updated = buildCustomer({ uuid: customer.uuid, name: "Metro Supplies" });
    (deps.repository.updateCustomer as jest.Mock).mockResolvedValue(updated);

    const result = await updateCustomer(
      {
        tenantId: 1n,
        customerUuid: customer.uuid,
        name: "Metro Supplies",
        creditLimit: "75000.0000",
        updatedBy: 7n,
      },
      deps,
    );

    expect(deps.repository.findCustomerByName).toHaveBeenCalledWith(
      1n,
      customer.companyUuid,
      "Metro Supplies",
    );
    expect(deps.repository.updateCustomer).toHaveBeenCalledWith(1n, customer.uuid, {
      name: "Metro Supplies",
      addressLine1: undefined,
      addressLine2: undefined,
      city: undefined,
      region: undefined,
      postalCode: undefined,
      countryCode: undefined,
      creditLimit: "75000.0000",
      paymentTerms: undefined,
      status: undefined,
      updatedBy: 7n,
    });
    expect(result).toBe(updated);
  });
});
