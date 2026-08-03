// Maps this module's Domain errors to the HTTP status/code pair
// (07_REST_API_STANDARDS.md §5.3/§9.4). The handbook's documented mechanism
// for this is a single centralized error-handling middleware
// (05_CODING_STANDARDS.md Ch.18.5/Ch.31.5) — out of scope for this task
// ("Do not implement middleware"). Kept here as a plain function, called
// from each controller's own catch block, so the mapping table still lives
// in exactly one place rather than being duplicated per controller; this is
// an interim measure until the real centralized middleware exists.
import {
  AccountLockedError,
  DomainError,
  InvalidCredentialsError,
  InvalidPasswordResetTokenError,
  InvalidRefreshTokenError,
  MfaChallengeInvalidError,
  MfaNotEnabledError,
  PasswordPolicyViolationError,
} from "../../business/authentication-errors";

export interface HttpErrorMapping {
  status: number;
  code: string;
}

export function mapDomainErrorToHttp(error: DomainError): HttpErrorMapping {
  if (error instanceof InvalidCredentialsError) {
    return { status: 401, code: "AUTH_INVALID_CREDENTIALS" };
  }
  if (error instanceof AccountLockedError) {
    return { status: 403, code: "AUTH_ACCOUNT_LOCKED" };
  }
  if (error instanceof MfaChallengeInvalidError) {
    return { status: 401, code: "AUTH_MFA_CHALLENGE_INVALID" };
  }
  if (error instanceof MfaNotEnabledError) {
    return { status: 409, code: "AUTH_MFA_NOT_ENABLED" };
  }
  if (error instanceof InvalidRefreshTokenError) {
    return { status: 401, code: "AUTH_INVALID_REFRESH_TOKEN" };
  }
  if (error instanceof InvalidPasswordResetTokenError) {
    return { status: 422, code: "AUTH_INVALID_RESET_TOKEN" };
  }
  if (error instanceof PasswordPolicyViolationError) {
    return { status: 422, code: "AUTH_PASSWORD_POLICY_VIOLATION" };
  }
  // Per 07_REST_API_STANDARDS.md §9.4's default for module-specific business
  // errors not individually listed.
  return { status: 422, code: "AUTH_DOMAIN_ERROR" };
}
