// Repository interface, owned by the Domain layer per 03_ARCHITECTURE.md
// Decision 5.7.2 — the Repository layer provides the implementation, never
// the contract. Every method is persistence-only (05_CODING_STANDARDS.md
// Ch.14.4): no sibling-name-uniqueness validation (Ch.35.8), no
// default-inheritance resolution (Ch.35.3/PCT-002) — those are
// Business-layer concerns that call these methods (03_ARCHITECTURE.md
// Ch.9.8/Decision 9.9.3, the same "Repository is persistence-only" boundary
// as every other module). Find methods return `null`, never throw, when
// nothing matches (05_CODING_STANDARDS.md Ch.8.5/Ch.14).
//
// Product Category is tenant-owned (06_DATABASE_STANDARDS.md MT-001, no
// convenience exceptions) — every method takes `tenantId` explicitly and
// re-asserts it in its own query, never relying on a previously-resolved
// row's identity (MT-002, Ch.6.4's worked example).
//
// `companyUuid` is a cross-module reference (FK-002) to Organization's
// `companies.uuid` — looked up/filtered by `uuid`, never a numeric id from
// another module's schema, mirroring Accounting's own `companyUuid`
// reference into Organization. `defaultTaxGroupUuid` is likewise a
// cross-module reference (FK-002) to Accounting's `tax_groups.uuid` — never
// validated for existence here (a future Business-layer concern).
//
// This interface is intentionally scoped to Product Category only this
// milestone. Unit (Ch.36), Product (Ch.34), and every later Inventory
// chapter will extend this same interface (and `PrismaInventoryRepository`)
// in later milestones, mirroring how `IAccountingRepository` grew one
// entity at a time across Accounting's own Repository milestones — not
// a separate repository per entity.
import { ProductCategory, CreateProductCategoryProps, UpdateProductCategoryProps } from "../entities/product-category.entity";

/**
 * Opaque handle for an in-flight transaction, supplied by the Business
 * layer's `$transaction` callback (03_ARCHITECTURE.md Decision 5.7.3 —
 * transactions are opened only at the Business layer) and passed through
 * unmodified. Kept as `unknown` rather than a Prisma-specific type so this
 * Domain-owned interface stays free of ORM types (Ch.5.3.4); the Repository
 * implementation casts it back to Prisma's transaction client internally.
 */
export type RepositoryTransaction = unknown;

export interface IInventoryRepository {
  createProductCategory(
    tenantId: bigint,
    props: CreateProductCategoryProps,
    tx?: RepositoryTransaction,
  ): Promise<ProductCategory>;
  findProductCategoryByUuid(tenantId: bigint, uuid: string): Promise<ProductCategory | null>;
  /** Optionally narrowed to a single Company (FK-002 `companyUuid`); omitted, returns every Product Category for the Tenant. */
  listProductCategories(tenantId: bigint, companyUuid?: string): Promise<ProductCategory[]>;
  updateProductCategory(
    tenantId: bigint,
    uuid: string,
    props: UpdateProductCategoryProps,
    tx?: RepositoryTransaction,
  ): Promise<ProductCategory>;
}
