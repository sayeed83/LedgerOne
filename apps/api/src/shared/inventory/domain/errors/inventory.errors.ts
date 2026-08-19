// Typed error hierarchy (05_CODING_STANDARDS.md Ch.18.3) — every business
// condition this module's use cases can fail with gets a named subclass of
// DomainError; presentation-layer code (not built yet) maps these to HTTP
// status codes. Never a bare `throw new Error(...)` for a known condition.
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Product Category does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateProductCategory` on zero rows matched (`updateMany`+refetch pattern), and by the Business layer when a supplied parent Product Category cannot be resolved. */
export class ProductCategoryNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Product Category '${identifier}' was not found.`);
  }
}

/** Raised by `createProductCategory`/`updateProductCategory` when another (non-deleted) Product Category with the same name already exists at the same hierarchy level (00_BUSINESS_RULES.md Ch.35.8) — i.e. shares the same Company and the same parent Product Category (including two root-level Categories, both with no parent). */
export class DuplicateProductCategoryNameError extends DomainError {
  constructor(public readonly companyUuid: string, public readonly productCategoryName: string) {
    super(`Product Category '${productCategoryName}' already exists at this hierarchy level for Company '${companyUuid}'.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Unit does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateUnit` on zero rows matched (`updateMany`+refetch pattern), and by the Business layer when a supplied base Unit cannot be resolved. */
export class UnitNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Unit '${identifier}' was not found.`);
  }
}

/** Raised by `createUnit`/`updateUnit` when a supplied `conversionFactor` is not a positive number (00_BUSINESS_RULES.md Ch.36.8 — "Conversion factor must be a positive number"). */
export class InvalidUnitConversionFactorValueError extends DomainError {
  constructor(public readonly conversionFactor: string) {
    super(`Unit conversion factor '${conversionFactor}' must be a positive number.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Product does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateProduct` on zero rows matched (`updateMany`+refetch pattern), and by the Business layer when a supplied Product cannot be resolved. */
export class ProductNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Product '${identifier}' was not found.`);
  }
}

/** Raised by `createProduct`/`updateProduct` when another (non-deleted) Product in the same Company already uses the same `productCode` (00_BUSINESS_RULES.md Ch.34.7 PRD-001 — "every Product must have a unique identifying code within the Company"). */
export class DuplicateProductCodeError extends DomainError {
  constructor(public readonly companyUuid: string, public readonly productCode: string) {
    super(`Product code '${productCode}' already exists for Company '${companyUuid}'.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Warehouse does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateWarehouse` on zero rows matched (`updateMany`+refetch pattern), and by the Business layer when a supplied Warehouse cannot be resolved. */
export class WarehouseNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Warehouse '${identifier}' was not found.`);
  }
}

/** Raised by `createWarehouse`/`updateWarehouse` when another (non-deleted) Warehouse in the same Branch already uses the same `warehouseCode` (00_BUSINESS_RULES.md Ch.37.8 — "Warehouse name must be unique within its Branch," applied identically to the identifying code, mirroring Product's own PRD-001 code-uniqueness treatment). */
export class DuplicateWarehouseCodeError extends DomainError {
  constructor(public readonly branchUuid: string, public readonly warehouseCode: string) {
    super(`Warehouse code '${warehouseCode}' already exists for Branch '${branchUuid}'.`);
  }
}

/** Raised by `createWarehouse`/`updateWarehouse` when another (non-deleted) Warehouse in the same Branch already uses the same `name` (00_BUSINESS_RULES.md Ch.37.8 — "Warehouse name must be unique within its Branch"). */
export class DuplicateWarehouseNameError extends DomainError {
  constructor(public readonly branchUuid: string, public readonly warehouseName: string) {
    super(`Warehouse '${warehouseName}' already exists for Branch '${branchUuid}'.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Stock does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateStock` on zero rows matched (`updateMany`+refetch pattern). */
export class StockNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Stock '${identifier}' was not found.`);
  }
}

/** Raised by `createStock`/`updateStock` when another (non-deleted) Stock row already exists for the same Warehouse/Product pair (00_BUSINESS_RULES.md Ch.38.3/STK-003 — "Stock is tracked independently per Product per Warehouse"), mirroring `findStockByWarehouseAndProduct`'s own natural key. */
export class StockAlreadyExistsError extends DomainError {
  constructor(public readonly warehouseUuid: string, public readonly productId: bigint) {
    super(`Stock already exists for Warehouse '${warehouseUuid}' and Product '${productId}'.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Inventory Adjustment does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateInventoryAdjustment` on zero rows matched (`updateMany`+refetch pattern). */
export class InventoryAdjustmentNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Inventory Adjustment '${identifier}' was not found.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Stock Movement does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Stock Movement has no update/remove method (Ch.39.5/STM-002 immutability), so this is thrown only by `findStockMovementByUuid`'s callers, mirroring `LedgerEntryNotFoundError`'s (accounting module) identical find-only usage. */
export class StockMovementNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Stock Movement '${identifier}' was not found.`);
  }
}

/** Raised by `createStockMovement` when the Warehouse field(s) 00_BUSINESS_RULES.md Ch.39.8/STM-003 require for the given `movementType` were not supplied: a RECEIPT needs `destinationWarehouseUuid`, an ISSUE needs `sourceWarehouseUuid`, and a TRANSFER needs both (STM-003 — "must record both the decrease at the source Warehouse and the increase at the destination Warehouse as one atomic movement"). ADJUSTMENT has no Ch.39.8-stated Warehouse-side requirement and is never checked here. */
export class StockMovementMissingRequiredWarehouseError extends DomainError {
  constructor(public readonly movementType: string, public readonly missingWarehouseSide: string) {
    super(`Stock Movement of type '${movementType}' requires ${missingWarehouseSide} to be specified.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Batch does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateBatch` on zero rows matched (`updateMany`+refetch pattern). */
export class BatchNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Batch '${identifier}' was not found.`);
  }
}

/** Raised by `createBatch`/`updateBatch` when both a `manufactureDate` and an `expiryDate` are present (either newly supplied or already on the row) and the manufacture date falls after the expiry date (00_BUSINESS_RULES.md Ch.40.8 — "Expiry date, if provided, must be after the manufacture date"). */
export class InvalidBatchDateRangeError extends DomainError {
  constructor(public readonly manufactureDate: Date, public readonly expiryDate: Date) {
    super(`Batch manufacture date '${manufactureDate.toISOString()}' must not be after expiry date '${expiryDate.toISOString()}'.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Reorder Level does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateReorderLevel` on zero rows matched (`updateMany`+refetch pattern). */
export class ReorderLevelNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Reorder Level '${identifier}' was not found.`);
  }
}

/** Raised by `createReorderLevel` when another (non-deleted) Reorder Level already exists for the same Warehouse/Product pair (00_BUSINESS_RULES.md Ch.42.7 ROL-101 — "A Reorder Level is defined per Product per Warehouse"), mirroring `findReorderLevelByWarehouseAndProduct`'s own natural key. */
export class ReorderLevelAlreadyExistsError extends DomainError {
  constructor(public readonly warehouseUuid: string, public readonly productId: bigint) {
    super(`Reorder Level already exists for Warehouse '${warehouseUuid}' and Product '${productId}'.`);
  }
}

/** Raised by `createReorderLevel`/`updateReorderLevel` when `reorderLevel` (the minimum threshold quantity) is negative (00_BUSINESS_RULES.md Ch.42.8 — "Reorder Level must be a non-negative quantity"). */
export class InvalidReorderLevelQuantityError extends DomainError {
  constructor(public readonly reorderLevel: string) {
    super(`Reorder Level quantity '${reorderLevel}' must be a non-negative quantity.`);
  }
}
