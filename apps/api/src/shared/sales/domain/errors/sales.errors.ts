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

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Customer does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateCustomer` on zero rows matched (`updateMany`+refetch pattern), and by the Business layer when a supplied Customer cannot be resolved. */
export class CustomerNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Customer '${identifier}' was not found.`);
  }
}

/** Raised by `createCustomer`/`updateCustomer` when another (non-deleted) Customer in the same Company already uses the same `name` (00_BUSINESS_RULES.md Ch.45.7 CUS-001 — every Customer belongs to exactly one Company; enforced here as name-uniqueness within that Company, mirroring Product's own PRD-001 code-uniqueness treatment). */
export class CustomerAlreadyExistsError extends DomainError {
  constructor(public readonly companyUuid: string, public readonly customerName: string) {
    super(`Customer '${customerName}' already exists for Company '${companyUuid}'.`);
  }
}
