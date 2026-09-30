import { createCustomer, CreateCustomerDeps, CreateCustomerInput } from "./create-customer.service";
import { CustomerAlreadyExistsError } from "../domain/errors/sales.errors";
import { buildCustomer, createFakeSalesRepository } from "./test-support/fixtures";

function buildDeps(): CreateCustomerDeps {
  return { repository: createFakeSalesRepository() };
}

function buildInput(overrides: Partial<CreateCustomerInput> = {}): CreateCustomerInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    name: "Regional Hardware Store",
    ...overrides,
  };
}

describe("createCustomer", () => {
  it("throws CustomerAlreadyExistsError when another Customer in the Company already uses the name", async () => {
    const deps = buildDeps();
    (deps.repository.findCustomerByName as jest.Mock).mockResolvedValue(buildCustomer());

    await expect(createCustomer(buildInput(), deps)).rejects.toThrow(CustomerAlreadyExistsError);
    expect(deps.repository.createCustomer).not.toHaveBeenCalled();
  });

  it("creates the Customer when the name is not already in use", async () => {
    const deps = buildDeps();
    (deps.repository.findCustomerByName as jest.Mock).mockResolvedValue(null);
    const created = buildCustomer();
    (deps.repository.createCustomer as jest.Mock).mockResolvedValue(created);

    const result = await createCustomer(
      buildInput({
        addressLine1: "221B Baker Street",
        city: "London",
        countryCode: "GB",
        creditLimit: "50000.0000",
        paymentTerms: "Net-30",
        createdBy: 5n,
      }),
      deps,
    );

    expect(deps.repository.findCustomerByName).toHaveBeenCalledWith(
      1n,
      "00000000-0000-0000-0000-000000000100",
      "Regional Hardware Store",
    );
    expect(deps.repository.createCustomer).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      name: "Regional Hardware Store",
      addressLine1: "221B Baker Street",
      addressLine2: null,
      city: "London",
      region: null,
      postalCode: null,
      countryCode: "GB",
      creditLimit: "50000.0000",
      paymentTerms: "Net-30",
      status: undefined,
      createdBy: 5n,
    });
    expect(result).toBe(created);
  });

  it("defaults createdBy to null when not supplied", async () => {
    const deps = buildDeps();
    (deps.repository.findCustomerByName as jest.Mock).mockResolvedValue(null);
    (deps.repository.createCustomer as jest.Mock).mockResolvedValue(buildCustomer());

    await createCustomer(buildInput(), deps);

    expect(deps.repository.createCustomer).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      name: "Regional Hardware Store",
      addressLine1: null,
      addressLine2: null,
      city: null,
      region: null,
      postalCode: null,
      countryCode: null,
      creditLimit: undefined,
      paymentTerms: null,
      status: undefined,
      createdBy: null,
    });
  });
});
