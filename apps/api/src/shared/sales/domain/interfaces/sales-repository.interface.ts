// Repository interface, owned by the Domain layer per 03_ARCHITECTURE.md
// Decision 5.7.2 — the Repository layer provides the implementation, never
// the contract. Every method is persistence-only (05_CODING_STANDARDS.md
// Ch.14.4): no duplicate-name detection, no credit-limit/outstanding-balance
// validation (CUS-002), no status-transition rule (Ch.45.5), no Business
// Location (Ch.9) or Price List (Ch.46) integration — all Business-layer
// concerns for a later milestone. Find methods return `null`, never throw,
// when nothing matches (05_CODING_STANDARDS.md Ch.8.5/Ch.14).
//
// Customer (Ch.45) is tenant-owned (06_DATABASE_STANDARDS.md MT-001, no
// convenience exceptions) — every method takes `tenantId` explicitly and
// re-asserts it in its own query, never relying on a previously-resolved
// row's identity (MT-002, Ch.6.4's worked example). `companyUuid` is a
// cross-module reference (FK-002) to Organization's `companies.uuid` —
// looked up/filtered by `uuid`, never a numeric id from another module's
// schema, mirroring Inventory's own `companyUuid` reference into
// Organization. `listCustomersByCompany` is scoped to a single Company;
// `listCustomers` returns every Customer for the Tenant, across every
// Company, mirroring `listWarehousesByBranch`/`listWarehousesByTenant`'s
// own narrowed-vs-tenant-wide listing shape (inventory module).
import { Customer, CreateCustomerProps, UpdateCustomerProps } from "../entities/customer.entity";

/**
 * Opaque handle for an in-flight transaction, supplied by the Business
 * layer's `$transaction` callback (03_ARCHITECTURE.md Decision 5.7.3 —
 * transactions are opened only at the Business layer) and passed through
 * unmodified. Kept as `unknown` rather than a Prisma-specific type so this
 * Domain-owned interface stays free of ORM types (Ch.5.3.4); the Repository
 * implementation casts it back to Prisma's transaction client internally.
 */
export type RepositoryTransaction = unknown;

export interface ISalesRepository {
  createCustomer(tenantId: bigint, props: CreateCustomerProps, tx?: RepositoryTransaction): Promise<Customer>;
  updateCustomer(
    tenantId: bigint,
    uuid: string,
    props: UpdateCustomerProps,
    tx?: RepositoryTransaction,
  ): Promise<Customer>;
  findCustomerByUuid(tenantId: bigint, uuid: string): Promise<Customer | null>;
  /** CUS-001's own name-uniqueness-within-Company natural key, mirroring `findProductByName`'s identical shape (inventory module). */
  findCustomerByName(tenantId: bigint, companyUuid: string, name: string): Promise<Customer | null>;
  /** Every Customer belonging to a single Company. */
  listCustomersByCompany(tenantId: bigint, companyUuid: string): Promise<Customer[]>;
  /** Every Customer for the Tenant, across every Company. */
  listCustomers(tenantId: bigint): Promise<Customer[]>;
}
