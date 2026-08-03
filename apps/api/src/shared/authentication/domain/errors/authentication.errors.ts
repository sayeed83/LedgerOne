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

/**
 * Deliberately generic — thrown for both "no such email" and "wrong
 * password" so the two are indistinguishable to the caller (AUTHN-005,
 * spec Acceptance Criteria #3). Never include which case occurred.
 */
export class InvalidCredentialsError extends DomainError {
  constructor() {
    super("Invalid email or password.");
  }
}

export class AccountLockedError extends DomainError {
  constructor(public readonly lockedUntil: Date) {
    super("Account is temporarily locked due to repeated failed login attempts.");
  }
}

export class MfaChallengeInvalidError extends DomainError {
  constructor() {
    super("MFA challenge token is invalid or has expired.");
  }
}

export class MfaNotEnabledError extends DomainError {
  constructor() {
    super("MFA is not enabled on this credential.");
  }
}

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super("Refresh token is invalid, expired, or has been revoked.");
  }
}

export class InvalidPasswordResetTokenError extends DomainError {
  constructor() {
    super("Password reset token is invalid, expired, or has already been used.");
  }
}

export class PasswordPolicyViolationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
