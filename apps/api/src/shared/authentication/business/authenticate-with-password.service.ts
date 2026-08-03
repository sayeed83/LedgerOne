// Business layer — login step 1 (spec §5, §11). Persistence-only via
// IAuthenticationRepository (never Prisma directly); no HTTP concerns.
import { randomUUID } from "crypto";
import { IAuthenticationRepository } from "../domain/interfaces/authentication-repository.interface";
import { IPasswordHasher } from "../domain/interfaces/password-hasher.interface";
import { ITokenIssuer } from "../domain/interfaces/token-issuer.interface";
import { IClock } from "../domain/interfaces/clock.interface";
import { AccountLockedError, InvalidCredentialsError } from "../domain/errors/authentication.errors";

// BRUTE-001: 10 consecutive failed attempts locks the account for 15 minutes.
// (Simplification: enforced via UserCredential.failedLoginCount, a running
// counter reset on success — not a true rolling 15-minute window over
// LoginAttempt rows, since the Repository layer exposes no query for that.
// Flagged as a follow-up if a stricter rolling window is required later.)
export const FAILED_LOGIN_LOCKOUT_THRESHOLD = 10;
export const ACCOUNT_LOCKOUT_DURATION_MS = 15 * 60 * 1000;
// AUTHN-002: refresh token session record lifetime.
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthenticateWithPasswordInput {
  tenantId: bigint;
  email: string;
  password: string;
  sourceIp: string;
  userAgent?: string | null;
}

export interface AuthenticateWithPasswordDeps {
  repository: IAuthenticationRepository;
  passwordHasher: IPasswordHasher;
  tokenIssuer: ITokenIssuer;
  clock: IClock;
}

export type AuthenticateWithPasswordResult =
  | { status: "mfa_required"; mfaChallengeToken: string }
  | { status: "authenticated"; accessToken: string; refreshToken: string };

export async function authenticateWithPassword(
  input: AuthenticateWithPasswordInput,
  deps: AuthenticateWithPasswordDeps,
): Promise<AuthenticateWithPasswordResult> {
  const { repository, passwordHasher, tokenIssuer, clock } = deps;

  const credential = await repository.findCredentialByEmail(input.tenantId, input.email);

  // AUTHN-005: identical failure for "no such email" and "wrong password".
  if (!credential) {
    await repository.recordLoginAttempt(input.tenantId, {
      tenantId: input.tenantId,
      userCredentialId: null,
      emailAttempted: input.email,
      isSuccessful: false,
      sourceIp: input.sourceIp,
      userAgent: input.userAgent,
    });
    throw new InvalidCredentialsError();
  }

  if (credential.lockedUntil && credential.lockedUntil > clock.now()) {
    await repository.recordLoginAttempt(input.tenantId, {
      tenantId: input.tenantId,
      userCredentialId: credential.id,
      emailAttempted: input.email,
      isSuccessful: false,
      sourceIp: input.sourceIp,
      userAgent: input.userAgent,
    });
    throw new AccountLockedError(credential.lockedUntil);
  }

  const isPasswordValid = await passwordHasher.verify(credential.passwordHash, input.password);

  await repository.recordLoginAttempt(input.tenantId, {
    tenantId: input.tenantId,
    userCredentialId: credential.id,
    emailAttempted: input.email,
    isSuccessful: isPasswordValid,
    sourceIp: input.sourceIp,
    userAgent: input.userAgent,
  });

  if (!isPasswordValid) {
    const updated = await repository.incrementFailedLoginAttempts(input.tenantId, credential.id);
    if (updated.failedLoginCount >= FAILED_LOGIN_LOCKOUT_THRESHOLD) {
      await repository.lockAccount(
        input.tenantId,
        credential.id,
        new Date(clock.now().getTime() + ACCOUNT_LOCKOUT_DURATION_MS),
      );
    }
    throw new InvalidCredentialsError();
  }

  await repository.resetFailedLoginAttempts(input.tenantId, credential.id);

  if (credential.isMfaEnabled) {
    const mfaChallengeToken = tokenIssuer.issueMfaChallengeToken({
      credentialUuid: credential.uuid,
      tenantId: input.tenantId.toString(),
    });
    return { status: "mfa_required", mfaChallengeToken };
  }

  return issueSessionTokens(
    input.tenantId,
    credential.userUuid,
    credential.id,
    repository,
    tokenIssuer,
    clock,
    input.sourceIp,
  );
}

/** Shared by the password and MFA login paths (spec §5) — issues both tokens and persists the refresh token's revocable record. */
export async function issueSessionTokens(
  tenantId: bigint,
  userUuid: string,
  credentialId: bigint,
  repository: IAuthenticationRepository,
  tokenIssuer: ITokenIssuer,
  clock: IClock,
  sourceIp: string,
): Promise<{ status: "authenticated"; accessToken: string; refreshToken: string }> {
  const jti = randomUUID();
  const refreshToken = tokenIssuer.issueRefreshToken({ sub: userUuid, tenantId: tenantId.toString(), jti });
  const accessToken = tokenIssuer.issueAccessToken({ sub: userUuid, tenantId: tenantId.toString() });

  await repository.createRefreshToken(tenantId, {
    tenantId,
    userCredentialId: credentialId,
    jti,
    expiresAt: new Date(clock.now().getTime() + REFRESH_TOKEN_TTL_MS),
    createdFromIp: sourceIp,
  });

  return { status: "authenticated", accessToken, refreshToken };
}
