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
//
// Warehouse (Ch.37) is likewise tenant-owned (MT-001) but carries
// `branchUuid`, not `companyUuid`, as its cross-module reference into
// Organization (FK-002, no DB-level FK): WHS-001/Ch.37.9/37.10 make Branch,
// not Company, Warehouse's real parent (see inventory.prisma's own
// file-level Handbook Deviation note from the Database milestone).
// `findWarehouseByCode` is scoped to a single Branch (Ch.37.8's own
// per-Branch uniqueness), mirroring `findProductByCode`'s own
// `(tenantId, companyUuid, code)` shape. No sibling-name/code-uniqueness
// validation, Branch-existence validation, or stock-based deactivation rule
// (WHS-002) is implemented here — persistence only, all Business-layer
// concerns for a later milestone.
//
// Stock (Ch.38) is likewise tenant-owned (MT-001) with cross-module/
// in-module uuid-reference fields `companyUuid`/`warehouseUuid` (FK-002, no
// DB-level FK) and a real, in-module FK `productId` to this module's own
// Product. `findStockByWarehouseAndProduct` mirrors STK-003's own natural
// key (at most one Stock row per Product per Warehouse). No on-hand/
// reserved/available arithmetic (STK-001), negative-stock prevention, or
// duplicate-Stock prevention is implemented here — persistence only, all
// Business-layer concerns for a later milestone.
//
// Inventory Adjustment (Ch.44) is likewise tenant-owned (MT-001) with
// cross-module/in-module uuid-reference fields `companyUuid`/`warehouseUuid`
// (FK-002, no DB-level FK) and a real, in-module FK `productId` to this
// module's own Product, mirroring Stock's own reference shape exactly. No
// reason-code validation (ADJ-001), approval-threshold workflow
// (ADJ-003/Ch.13), Stock Movement/Journal Entry generation (ADJ-002), or
// application of the adjustment against Stock's own on-hand quantity is
// implemented here — persistence only, all Business-layer concerns for a
// later milestone.
//
// Stock Movement (Ch.39) is likewise tenant-owned (MT-001) with a
// cross-module `companyUuid` reference and a real, in-module FK `productId`
// to this module's own Product, but has NO update method at all — Ch.39.5/
// STM-002 make it immutable once recorded ("correction requires a new,
// offsetting Stock Movement, never a direct edit"), mirroring
// `ILedgerRepository`'s (accounting module) identical append-only shape for
// the same reason (LDG-002). `sourceWarehouseUuid`/`destinationWarehouseUuid`
// are both nullable cross-module uuid-reference fields (FK-002, no DB-level
// FK) implementing Ch.39.10's ERD's two independent Warehouse relationships.
// `listStockMovementsByWarehouse` matches either side (STM-003's Transfer
// populates both on one row). No movement-type/warehouse-side cross-column
// validation, Stock-application arithmetic, or Journal Entry generation is
// implemented here — persistence only, all Business-layer concerns for a
// later milestone.
import { ProductCategory, CreateProductCategoryProps, UpdateProductCategoryProps } from "../entities/product-category.entity";
import { Unit, CreateUnitProps, UpdateUnitProps } from "../entities/unit.entity";
import { Product, CreateProductProps, UpdateProductProps } from "../entities/product.entity";
import { Warehouse, CreateWarehouseProps, UpdateWarehouseProps } from "../entities/warehouse.entity";
import { Stock, CreateStockProps, UpdateStockProps } from "../entities/stock.entity";
import {
  InventoryAdjustment,
  CreateInventoryAdjustmentProps,
  UpdateInventoryAdjustmentProps,
} from "../entities/inventory-adjustment.entity";
import { StockMovement, CreateStockMovementProps } from "../entities/stock-movement.entity";

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

  createWarehouse(tenantId: bigint, props: CreateWarehouseProps, tx?: RepositoryTransaction): Promise<Warehouse>;
  updateWarehouse(
    tenantId: bigint,
    uuid: string,
    props: UpdateWarehouseProps,
    tx?: RepositoryTransaction,
  ): Promise<Warehouse>;
  findWarehouseByUuid(tenantId: bigint, uuid: string): Promise<Warehouse | null>;
  /** Scoped to a single Branch (`warehouseCode` has no meaning tenant-wide across different Branches' own warehouse listings), mirroring `findProductByCode`'s own `(tenantId, companyUuid, code)` shape. */
  findWarehouseByCode(tenantId: bigint, branchUuid: string, warehouseCode: string): Promise<Warehouse | null>;
  /** Every Warehouse belonging to a single Branch (WHS-001). */
  listWarehousesByBranch(tenantId: bigint, branchUuid: string): Promise<Warehouse[]>;
  /** Every Warehouse for the Tenant, across every Branch. */
  listWarehousesByTenant(tenantId: bigint): Promise<Warehouse[]>;

  createStock(tenantId: bigint, props: CreateStockProps, tx?: RepositoryTransaction): Promise<Stock>;
  updateStock(tenantId: bigint, uuid: string, props: UpdateStockProps, tx?: RepositoryTransaction): Promise<Stock>;
  findStockByUuid(tenantId: bigint, uuid: string): Promise<Stock | null>;
  /** STK-003's own natural key — at most one (non-deleted) Stock row per Product per Warehouse. */
  findStockByWarehouseAndProduct(tenantId: bigint, warehouseUuid: string, productId: bigint): Promise<Stock | null>;
  /** Every Stock row belonging to a single Warehouse. */
  listStocksByWarehouse(tenantId: bigint, warehouseUuid: string): Promise<Stock[]>;
  /** Every Stock row belonging to a single Company, across every Warehouse. */
  listStocksByCompany(tenantId: bigint, companyUuid: string): Promise<Stock[]>;

  createInventoryAdjustment(
    tenantId: bigint,
    props: CreateInventoryAdjustmentProps,
    tx?: RepositoryTransaction,
  ): Promise<InventoryAdjustment>;
  updateInventoryAdjustment(
    tenantId: bigint,
    uuid: string,
    props: UpdateInventoryAdjustmentProps,
    tx?: RepositoryTransaction,
  ): Promise<InventoryAdjustment>;
  findInventoryAdjustmentByUuid(tenantId: bigint, uuid: string): Promise<InventoryAdjustment | null>;
  /** Every Inventory Adjustment belonging to a single Warehouse. */
  listInventoryAdjustmentsByWarehouse(tenantId: bigint, warehouseUuid: string): Promise<InventoryAdjustment[]>;
  /** Every Inventory Adjustment belonging to a single Product, across every Warehouse. */
  listInventoryAdjustmentsByProduct(tenantId: bigint, productId: bigint): Promise<InventoryAdjustment[]>;
  /** Every Inventory Adjustment belonging to a single Company, across every Warehouse. */
  listInventoryAdjustmentsByCompany(tenantId: bigint, companyUuid: string): Promise<InventoryAdjustment[]>;

  /** No `updateStockMovement` — Stock Movement is immutable (Ch.39.5/STM-002), mirroring `ILedgerRepository`'s identical append-only shape (no update method exists there either). */
  createStockMovement(
    tenantId: bigint,
    props: CreateStockMovementProps,
    tx?: RepositoryTransaction,
  ): Promise<StockMovement>;
  findStockMovementByUuid(tenantId: bigint, uuid: string): Promise<StockMovement | null>;
  /** Every Stock Movement involving a single Warehouse, on either side (`sourceWarehouseUuid` or `destinationWarehouseUuid`). */
  listStockMovementsByWarehouse(tenantId: bigint, warehouseUuid: string): Promise<StockMovement[]>;
  /** Every Stock Movement belonging to a single Product, across every Warehouse. */
  listStockMovementsByProduct(tenantId: bigint, productId: bigint): Promise<StockMovement[]>;
  /** Every Stock Movement belonging to a single Company, across every Warehouse. */
  listStockMovementsByCompany(tenantId: bigint, companyUuid: string): Promise<StockMovement[]>;
}
