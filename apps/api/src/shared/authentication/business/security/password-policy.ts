import { PasswordPolicyViolationError } from "../../domain/errors/authentication.errors";

// PWD-003: 12-128 characters, no forced character-class composition rule.
// PWD-004 (breach-corpus check) is not implemented here — it needs an
// external service (e.g. HaveIBeenPwned k-anonymity API) not yet wired into
// this module; flagged as a follow-up rather than fabricated.
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

export function assertPasswordMeetsPolicy(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new PasswordPolicyViolationError(
      `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
    );
  }
}
