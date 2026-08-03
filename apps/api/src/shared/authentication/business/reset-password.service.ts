// Business layer — consumes a password reset token (spec §10). On success,
// every active session is revoked (SESS-005 — a reset is a compromise
// trigger). Does not invalidate *other* outstanding reset tokens for the
// same account (PWD-006) — the Repository layer exposes no method to look
// up or bulk-invalidate a credential's other tokens; flagged as a follow-up.
import { IAuthenticationRepository } from "../domain/interfaces/authentication-repository.interface";
import { IPasswordHasher } from "../domain/interfaces/password-hasher.interface";
import { IClock } from "../domain/interfaces/clock.interface";
import { InvalidPasswordResetTokenError } from "../domain/errors/authentication.errors";
import { hashResetToken } from "./security/reset-token";
import { assertPasswordMeetsPolicy } from "./security/password-policy";

export interface ResetPasswordInput {
  tenantId: bigint;
  token: string;
  newPassword: string;
}

export interface ResetPasswordDeps {
  repository: IAuthenticationRepository;
  passwordHasher: IPasswordHasher;
  clock: IClock;
}

export async function resetPassword(input: ResetPasswordInput, deps: ResetPasswordDeps): Promise<void> {
  const { repository, passwordHasher, clock } = deps;

  assertPasswordMeetsPolicy(input.newPassword);

  const record = await repository.findPasswordResetToken(input.tenantId, hashResetToken(input.token));
  if (!record || record.usedAt !== null || record.expiresAt <= clock.now()) {
    throw new InvalidPasswordResetTokenError();
  }

  const newPasswordHash = await passwordHasher.hash(input.newPassword);
  await repository.updatePasswordHash(input.tenantId, record.userCredentialId, newPasswordHash);
  await repository.markPasswordResetTokenUsed(input.tenantId, record.id);
  await repository.revokeAllRefreshTokens(input.tenantId, record.userCredentialId);
}
