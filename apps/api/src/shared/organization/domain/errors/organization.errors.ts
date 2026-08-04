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

export class TenantNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Tenant '${identifier}' was not found.`);
  }
}

export class TenantSettingsNotFoundError extends DomainError {
  constructor(tenantUuid: string) {
    super(`Tenant settings for tenant '${tenantUuid}' were not found.`);
  }
}

export class TenantSubscriptionNotFoundError extends DomainError {
  constructor(tenantUuid: string) {
    super(`Tenant subscription for tenant '${tenantUuid}' was not found.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Company does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). */
export class CompanyNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Company '${identifier}' was not found.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Branch does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). */
export class BranchNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Branch '${identifier}' was not found.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Department does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). */
export class DepartmentNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Department '${identifier}' was not found.`);
  }
}

/**
 * Raised when a requested status change does not follow the Organization
 * lifecycle state machine (00_BUSINESS_RULES.md Ch.1.6): Provisioning/Suspended
 * → Active, Active → Suspended, Active/Suspended → Deactivated. Every other
 * transition (including any transition out of Deactivated, a terminal state)
 * is invalid.
 */
export class InvalidTenantStatusTransitionError extends DomainError {
  constructor(public readonly from: string, public readonly to: string) {
    super(`Tenant cannot transition from '${from}' to '${to}'.`);
  }
}

/**
 * Raised by ValidateTenantIsActive (00_BUSINESS_RULES.md Ch.1.6's "Can Users
 * Transact?" column) — the guard other modules call before allowing a
 * tenant-scoped business operation to proceed.
 */
export class TenantNotActiveError extends DomainError {
  constructor(public readonly tenantUuid: string, public readonly status: string) {
    super(`Tenant '${tenantUuid}' is not Active (current status: '${status}').`);
  }
}

/**
 * Raised when a requested Company status change does not follow the
 * Ch.2.6 lifecycle: Draft/Closed → Active, Active → Closed. Dissolving a
 * Company is not part of this milestone.
 */
export class InvalidCompanyStatusTransitionError extends DomainError {
  constructor(public readonly from: string, public readonly to: string) {
    super(`Company cannot transition from '${from}' to '${to}'.`);
  }
}

/** Raised when a Company code would collide with another Company already registered under the same Tenant (06_DATABASE_STANDARDS.md unique constraint on `(tenantId, companyCode)`). */
export class DuplicateCompanyCodeError extends DomainError {
  constructor(public readonly companyCode: string) {
    super(`Company code '${companyCode}' is already in use within this tenant.`);
  }
}

/** Raised when a Branch code would collide with another Branch already registered under the same Company (unique constraint on `(companyId, branchCode)`). */
export class DuplicateBranchCodeError extends DomainError {
  constructor(public readonly branchCode: string) {
    super(`Branch code '${branchCode}' is already in use within this company.`);
  }
}

/** Raised when a Department code would collide with another Department already registered under the same Company (unique constraint on `(companyId, departmentCode)`). */
export class DuplicateDepartmentCodeError extends DomainError {
  constructor(public readonly departmentCode: string) {
    super(`Department code '${departmentCode}' is already in use within this company.`);
  }
}
