// Business layer — login step 2, completing an MFA-required login (spec §5).
import { IAuthenticationRepository } from "../domain/interfaces/authentication-repository.interface";
import { ITokenIssuer } from "../domain/interfaces/token-issuer.interface";
import { ITotpProvider } from "../domain/interfaces/totp-provider.interface";
import { IClock } from "../domain/interfaces/clock.interface";
import { InvalidCredentialsError, MfaChallengeInvalidError, MfaNotEnabledError } from "../domain/errors/authentication.errors";
import {
  FAILED_LOGIN_LOCKOUT_THRESHOLD,
  ACCOUNT_LOCKOUT_DURATION_MS,
  issueSessionTokens,
  AuthenticateWithPasswordResult,
} from "./authenticate-with-password.service";

export interface VerifyMfaChallengeInput {
  tenantId: bigint;
  mfaChallengeToken: string;
  totpCode: string;
  sourceIp: string;
  userAgent?: string | null;
}

export interface VerifyMfaChallengeDeps {
  repository: IAuthenticationRepository;
  tokenIssuer: ITokenIssuer;
  totpProvider: ITotpProvider;
  clock: IClock;
}

export async function verifyMfaChallenge(
  input: VerifyMfaChallengeInput,
  deps: VerifyMfaChallengeDeps,
): Promise<Extract<AuthenticateWithPasswordResult, { status: "authenticated" }>> {
  const { repository, tokenIssuer, totpProvider, clock } = deps;

  let challengeClaims;
  try {
    challengeClaims = tokenIssuer.verifyMfaChallengeToken(input.mfaChallengeToken);
  } catch {
    throw new MfaChallengeInvalidError();
  }

  if (challengeClaims.tenantId !== input.tenantId.toString()) {
    throw new MfaChallengeInvalidError();
  }

  const credential = await repository.findCredentialByUuid(input.tenantId, challengeClaims.credentialUuid);
  if (!credential) {
    throw new MfaChallengeInvalidError();
  }
  if (!credential.isMfaEnabled || !credential.mfaSecret) {
    throw new MfaNotEnabledError();
  }

  const isCodeValid = totpProvider.verifyToken(credential.mfaSecret, input.totpCode);

  await repository.recordLoginAttempt(input.tenantId, {
    tenantId: input.tenantId,
    userCredentialId: credential.id,
    emailAttempted: credential.email,
    isSuccessful: isCodeValid,
    sourceIp: input.sourceIp,
    userAgent: input.userAgent,
  });

  if (!isCodeValid) {
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
