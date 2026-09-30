// Shared test fixtures/fakes for Business-layer unit tests
// (05_CODING_STANDARDS.md Ch.10.6 — a unit test constructs a fake `deps`
// object directly, no mocking framework/container required). Not a
// `.service.ts` file itself, so it carries no use-case naming suffix.
import { Customer } from "../../domain/entities/customer.entity";
import { CustomerStatus } from "../../domain/enums/customer-status.enum";
import { ISalesRepository } from "../../domain/interfaces/sales-repository.interface";

export function buildCustomer(overrides: Partial<Customer> = {}): Customer {
  const base = new Customer(
    1n,
    "00000000-0000-0000-0000-000000000001",
    1n,
    "00000000-0000-0000-0000-000000000100",
    "Regional Hardware Store",
    "221B Baker Street",
    null,
    "London",
    null,
    "NW1 6XE",
    "GB",
    "50000.0000",
    "Net-30",
    CustomerStatus.Prospect,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(Customer.prototype), base, overrides) as Customer;
}

export function createFakeSalesRepository(): jest.Mocked<ISalesRepository> {
  return {
    createCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    findCustomerByUuid: jest.fn(),
    findCustomerByName: jest.fn(),
    listCustomersByCompany: jest.fn(),
    listCustomers: jest.fn(),
  };
}
