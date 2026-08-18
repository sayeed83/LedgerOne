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
// This interface grows one entity at a time across separate Repository
// milestones — Product Category (Ch.35) first, Unit (Ch.36) added by this
// milestone — mirroring how `IAccountingRepository` grew one entity at a
// time across Accounting's own Repository milestones. Product (Ch.34) and
// every later Inventory chapter will extend this same interface (and
// `PrismaInventoryRepository`) in future milestones — not a separate
// repository per entity.
//
// Unit is likewise tenant-owned (MT-001, no convenience exceptions) with a
// cross-module `companyUuid` reference into Organization. `findUnitByName`/
// `findUnitBySymbol` are scoped to a single Company (name/symbol have no
// meaning tenant-wide across different Companies' own unit catalogs,
// mirroring `findAccountByCode`'s own `(tenantId, companyUuid, code)`
// natural-key shape). `listBaseUnits` returns only rows with a `null`
// `baseUnitId` (Ch.36.1/36.11 — a row with no base Unit of its own IS a
// base Unit) — a plain persistence-level filter, not a business rule.
//
// Product (Ch.34) is likewise tenant-owned (MT-001) with a cross-module
// `companyUuid` reference into Organization; `productCategoryId`/`unitId`
// are real, in-module foreign keys (inventory.prisma FK-001), accepted as
// plain bigints with no cross-repository existence validation, mirroring
// Account's own handling of `accountGroupId`/`parentAccountId`.
// `findProductByCode`/`findProductByName` are scoped to a single Company
// (code/name have no meaning tenant-wide across different Companies' own
// product catalogs), mirroring `findUnitByName`/`findUnitBySymbol`'s own
// shape. No sibling-name/code-uniqueness validation, Stocked/Unit-required
// validation (Ch.34.8), or status-transition rule (PRD-003, Ch.34.12) is
// implemented here — persistence only, all Business-layer concerns for a
// later milestone.
import { ProductCategory, CreateProductCategoryProps, UpdateProductCategoryProps } from "../entities/product-category.entity";
import { Unit, CreateUnitProps, UpdateUnitProps } from "../entities/unit.entity";
import { Product, CreateProductProps, UpdateProductProps } from "../entities/product.entity";

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

  createUnit(tenantId: bigint, props: CreateUnitProps, tx?: RepositoryTransaction): Promise<Unit>;
  updateUnit(tenantId: bigint, uuid: string, props: UpdateUnitProps, tx?: RepositoryTransaction): Promise<Unit>;
  findUnitByUuid(tenantId: bigint, uuid: string): Promise<Unit | null>;
  /** Every Unit belonging to a single Company. */
  listUnitsByCompany(tenantId: bigint, companyUuid: string): Promise<Unit[]>;
  /** Every Unit in a Company with no `baseUnitId` of its own — i.e. a base Unit (Ch.36.1/36.11). */
  listBaseUnits(tenantId: bigint, companyUuid: string): Promise<Unit[]>;
  findUnitByName(tenantId: bigint, companyUuid: string, name: string): Promise<Unit | null>;
  findUnitBySymbol(tenantId: bigint, companyUuid: string, symbol: string): Promise<Unit | null>;

  createProduct(tenantId: bigint, props: CreateProductProps, tx?: RepositoryTransaction): Promise<Product>;
  updateProduct(
    tenantId: bigint,
    uuid: string,
    props: UpdateProductProps,
    tx?: RepositoryTransaction,
  ): Promise<Product>;
  findProductByUuid(tenantId: bigint, uuid: string): Promise<Product | null>;
  /** Every Product belonging to a single Company. */
  listProductsByCompany(tenantId: bigint, companyUuid: string): Promise<Product[]>;
  findProductByCode(tenantId: bigint, companyUuid: string, productCode: string): Promise<Product | null>;
  findProductByName(tenantId: bigint, companyUuid: string, name: string): Promise<Product | null>;
}
