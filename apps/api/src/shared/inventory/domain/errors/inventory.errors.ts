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
