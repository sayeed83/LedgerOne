// Business layer — forgot-password request (spec §9). Always completes the
// same way regardless of whether the email exists (AUTHN-005 extended to
// this endpoint) — the caller (future Presentation layer) must send the
// same generic response either way and only email something when a token
// actually comes back. Sending the email itself is not this module's
// concern (AWS SES integration lives outside the Business layer).
import { IAuthenticationRepository } from "../domain/interfaces/authentication-repository.interface";
import { IClock } from "../domain/interfaces/clock.interface";
import { generateResetToken, hashResetToken } from "./security/reset-token";

// PWD-006: reset tokens expire in 15 minutes.
export const PASSWORD_RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

export interface RequestPasswordResetInput {
  tenantId: bigint;
  email: string;
}

export interface RequestPasswordResetDeps {
  repository: IAuthenticationRepository;
  clock: IClock;
}

export interface RequestPasswordResetResult {
  /** Present only when the account exists — the plaintext token to deliver out-of-band (email). Never persisted in plaintext. */
  resetToken?: string;
}

export async function requestPasswordReset(
  input: RequestPasswordResetInput,
  deps: RequestPasswordResetDeps,
): Promise<RequestPasswordResetResult> {
  const { repository, clock } = deps;

  const credential = await repository.findCredentialByEmail(input.tenantId, input.email);
  if (!credential) {
    return {};
  }

  const resetToken = generateResetToken();
  await repository.createPasswordResetToken(input.tenantId, {
    tenantId: input.tenantId,
    userCredentialId: credential.id,
    tokenHash: hashResetToken(resetToken),
    expiresAt: new Date(clock.now().getTime() + PASSWORD_RESET_TOKEN_TTL_MS),
  });

  return { resetToken };
}
