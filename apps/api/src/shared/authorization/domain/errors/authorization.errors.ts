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

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Role does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). */
export class RoleNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Role '${identifier}' was not found.`);
  }
}

/**
 * Raised when a requested status change does not follow the Role lifecycle
 * state machine (00_BUSINESS_RULES.md Ch.11.5): Active → Retired only. Every
 * other transition (including any transition out of Retired) is invalid.
 */
export class InvalidRoleStatusTransitionError extends DomainError {
  constructor(public readonly from: string, public readonly to: string) {
    super(`Role cannot transition from '${from}' to '${to}'.`);
  }
}

/** Raised when a Role↔Permission grant (00_BUSINESS_RULES.md Ch.11.3/Ch.12.10) is not found — either never assigned or already removed. */
export class RolePermissionNotFoundError extends DomainError {
  constructor(public readonly roleId: string, public readonly permissionId: string) {
    super(`Permission '${permissionId}' is not assigned to Role '${roleId}'.`);
  }
}

/** Raised when a User↔Role assignment (00_BUSINESS_RULES.md Ch.11.10) is not found — either never assigned or already removed. */
export class UserRoleNotFoundError extends DomainError {
  constructor(public readonly userUuid: string, public readonly roleId: string) {
    super(`Role '${roleId}' is not assigned to User '${userUuid}'.`);
  }
}

/** Raised when a Role name would collide with another Role already registered under the same Tenant (00_BUSINESS_RULES.md Ch.11.8, 06_DATABASE_STANDARDS.md unique constraint on `(tenantId, name, deletedAt)`). */
export class DuplicateRoleNameError extends DomainError {
  constructor(public readonly roleName: string) {
    super(`Role name '${roleName}' is already in use within this tenant.`);
  }
}

/** Raised when a lookup by `permissionKey` matches no row — the Permission does not exist (00_BUSINESS_RULES.md Ch.12). */
export class PermissionNotFoundError extends DomainError {
  constructor(permissionKey: string) {
    super(`Permission '${permissionKey}' was not found.`);
  }
}

/** Raised when attempting to grant a Permission to a Role that already grants it (00_BUSINESS_RULES.md Ch.11.3/Ch.12.10 — a grant is a set membership, not a multiset). */
export class DuplicatePermissionAssignmentError extends DomainError {
  constructor(public readonly roleUuid: string, public readonly permissionKey: string) {
    super(`Permission '${permissionKey}' is already assigned to Role '${roleUuid}'.`);
  }
}

/** Raised when attempting to assign a Role to a User who is already assigned that Role (00_BUSINESS_RULES.md Ch.11.10 — an assignment is a set membership, not a multiset). */
export class DuplicateRoleAssignmentError extends DomainError {
  constructor(public readonly userUuid: string, public readonly roleUuid: string) {
    super(`Role '${roleUuid}' is already assigned to User '${userUuid}'.`);
  }
}

/**
 * Raised when attempting to assign a Retired Role to a new User
 * (00_BUSINESS_RULES.md Ch.11.5 — retiring a Role makes it "no longer
 * assignable to new Users," though existing assignments persist until
 * reassigned).
 */
export class RoleNotAssignableError extends DomainError {
  constructor(public readonly roleUuid: string, public readonly status: string) {
    super(`Role '${roleUuid}' is not assignable (current status: '${status}').`);
  }
}

/**
 * Raised by ValidateUserPermission — the authoritative Business-layer
 * authorization check (03_ARCHITECTURE.md Ch.9.8/Decision 9.9.3) other
 * modules' use cases call before allowing a permission-gated operation to
 * proceed. A Retired Role's existing grants still count toward this check
 * (Ch.11.5 — assignments persist after retirement), so this is purely a
 * "does the Permission appear anywhere in the User's assigned Roles" check.
 */
export class PermissionDeniedError extends DomainError {
  constructor(public readonly userUuid: string, public readonly permissionKey: string) {
    super(`User '${userUuid}' does not have permission '${permissionKey}'.`);
  }
}
