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
