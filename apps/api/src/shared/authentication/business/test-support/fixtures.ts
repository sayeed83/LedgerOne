// Shared test fixtures/fakes for Business-layer unit tests
// (05_CODING_STANDARDS.md Ch.10.6 — a unit test constructs a fake `deps`
// object directly, no mocking framework/container required). Not a
// `.service.ts` file itself, so it carries no use-case naming suffix.
import { UserCredential } from "../../domain/aggregates/user-credential.aggregate";
import { RefreshToken } from "../../domain/entities/refresh-token.entity";
import { PasswordResetToken } from "../../domain/entities/password-reset-token.entity";
import { LoginAttempt } from "../../domain/entities/login-attempt.entity";
import { IAuthenticationRepository } from "../../domain/interfaces/authentication-repository.interface";
import { IClock } from "../../domain/interfaces/clock.interface";

export function buildUserCredential(overrides: Partial<UserCredential> = {}): UserCredential {
  const base = new UserCredential(
    1n,
    "00000000-0000-0000-0000-000000000001",
    1n,
    "00000000-0000-0000-0000-0000000000aa",
    "user@example.com",
    "hashed-password",
    false,
    null,
    0,
    null,
    null,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(UserCredential.prototype), base, overrides) as UserCredential;
}

export function buildRefreshToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
  const base = new RefreshToken(
    1n,
    "00000000-0000-0000-0000-000000000002",
    1n,
    1n,
    "jti-1",
    new Date("2026-01-08T00:00:00.000Z"),
    null,
    "127.0.0.1",
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
  );
  return Object.assign(Object.create(RefreshToken.prototype), base, overrides) as RefreshToken;
}

export function buildPasswordResetToken(overrides: Partial<PasswordResetToken> = {}): PasswordResetToken {
  const base = new PasswordResetToken(
    1n,
    "00000000-0000-0000-0000-000000000003",
    1n,
    1n,
    "token-hash",
    new Date("2026-01-01T00:15:00.000Z"),
    null,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
  );
  return Object.assign(Object.create(PasswordResetToken.prototype), base, overrides) as PasswordResetToken;
}

export function createFakeAuthenticationRepository(): jest.Mocked<IAuthenticationRepository> {
  return {
    findCredentialByEmail: jest.fn(),
    findCredentialByUuid: jest.fn(),
    createCredential: jest.fn(),
    updatePasswordHash: jest.fn(),
    incrementFailedLoginAttempts: jest.fn(),
    resetFailedLoginAttempts: jest.fn(),
    lockAccount: jest.fn(),
    unlockAccount: jest.fn(),
    createRefreshToken: jest.fn(),
    findValidRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllRefreshTokens: jest.fn(),
    createPasswordResetToken: jest.fn(),
    findPasswordResetToken: jest.fn(),
    markPasswordResetTokenUsed: jest.fn(),
    recordLoginAttempt: jest.fn(),
  };
}

export function createFakeClock(fixedNow: Date): IClock {
  return { now: () => fixedNow };
}

export type FakeLoginAttempt = LoginAttempt;
