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

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the User does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). */
export class UserNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`User '${identifier}' was not found.`);
  }
}

/**
 * Raised when a requested status change does not follow the User lifecycle
 * state machine (00_BUSINESS_RULES.md Ch.10.5): Invited/Suspended → Active,
 * Active → Suspended, Active → Deactivated. Every other transition
 * (including any transition out of Deactivated, a terminal state) is invalid.
 */
export class InvalidUserStatusTransitionError extends DomainError {
  constructor(public readonly from: string, public readonly to: string) {
    super(`User cannot transition from '${from}' to '${to}'.`);
  }
}

/** Raised when a User's email would collide with another User already registered under the same Tenant (00_BUSINESS_RULES.md Ch.10.8, 06_DATABASE_STANDARDS.md unique constraint on `(tenantId, email, deletedAt)`). */
export class DuplicateUserEmailError extends DomainError {
  constructor(public readonly email: string) {
    super(`Email '${email}' is already in use within this tenant.`);
  }
}

/**
 * Raised by ValidateUserActive — the guard other use cases call before
 * allowing a User-scoped operation to proceed (mirrors Organization's
 * ValidateTenantIsActive; only an Active User is presumed able to transact,
 * consistent with USR-002).
 */
export class UserNotActiveError extends DomainError {
  constructor(public readonly userUuid: string, public readonly status: string) {
    super(`User '${userUuid}' is not Active (current status: '${status}').`);
  }
}
