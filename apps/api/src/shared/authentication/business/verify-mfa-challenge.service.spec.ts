import { verifyMfaChallenge, VerifyMfaChallengeDeps } from "./verify-mfa-challenge.service";
import { InvalidCredentialsError, MfaChallengeInvalidError, MfaNotEnabledError } from "../domain/errors/authentication.errors";
import { ITokenIssuer } from "../domain/interfaces/token-issuer.interface";
import { ITotpProvider } from "../domain/interfaces/totp-provider.interface";
import { buildUserCredential, createFakeAuthenticationRepository, createFakeClock } from "./test-support/fixtures";

const NOW = new Date("2026-01-15T12:00:00.000Z");

function buildDeps(): VerifyMfaChallengeDeps {
  const tokenIssuer: jest.Mocked<ITokenIssuer> = {
    issueAccessToken: jest.fn().mockReturnValue("access-token"),
    verifyAccessToken: jest.fn(),
    issueRefreshToken: jest.fn().mockReturnValue("refresh-token"),
    verifyRefreshToken: jest.fn(),
    issueMfaChallengeToken: jest.fn(),
    verifyMfaChallengeToken: jest.fn().mockReturnValue({ credentialUuid: "cred-uuid", tenantId: "1" }),
  };
  const totpProvider: jest.Mocked<ITotpProvider> = { generateSecret: jest.fn(), verifyToken: jest.fn() };
  return {
    repository: createFakeAuthenticationRepository(),
    tokenIssuer,
    totpProvider,
    clock: createFakeClock(NOW),
  };
}

const baseInput = { tenantId: 1n, mfaChallengeToken: "challenge", totpCode: "123456", sourceIp: "127.0.0.1" };

describe("verifyMfaChallenge", () => {
  it("throws MfaChallengeInvalidError when the challenge token fails verification", async () => {
    const deps = buildDeps();
    (deps.tokenIssuer.verifyMfaChallengeToken as jest.Mock).mockImplementation(() => {
      throw new Error("bad token");
    });

    await expect(verifyMfaChallenge(baseInput, deps)).rejects.toThrow(MfaChallengeInvalidError);
  });

  it("throws MfaChallengeInvalidError when the challenge token's tenant does not match", async () => {
    const deps = buildDeps();
    (deps.tokenIssuer.verifyMfaChallengeToken as jest.Mock).mockReturnValue({ credentialUuid: "cred-uuid", tenantId: "2" });

    await expect(verifyMfaChallenge(baseInput, deps)).rejects.toThrow(MfaChallengeInvalidError);
  });

  it("throws MfaChallengeInvalidError when the credential no longer exists", async () => {
    const deps = buildDeps();
    (deps.repository.findCredentialByUuid as jest.Mock).mockResolvedValue(null);

    await expect(verifyMfaChallenge(baseInput, deps)).rejects.toThrow(MfaChallengeInvalidError);
  });

  it("throws MfaNotEnabledError when the credential has no MFA secret", async () => {
    const deps = buildDeps();
    (deps.repository.findCredentialByUuid as jest.Mock).mockResolvedValue(buildUserCredential({ isMfaEnabled: false }));

    await expect(verifyMfaChallenge(baseInput, deps)).rejects.toThrow(MfaNotEnabledError);
  });

  it("throws InvalidCredentialsError and increments the failure counter on a wrong TOTP code", async () => {
    const deps = buildDeps();
    const credential = buildUserCredential({ isMfaEnabled: true, mfaSecret: "secret", failedLoginCount: 2 });
    (deps.repository.findCredentialByUuid as jest.Mock).mockResolvedValue(credential);
    (deps.totpProvider.verifyToken as jest.Mock).mockReturnValue(false);
    (deps.repository.incrementFailedLoginAttempts as jest.Mock).mockResolvedValue(
      buildUserCredential({ failedLoginCount: 3 }),
    );

    await expect(verifyMfaChallenge(baseInput, deps)).rejects.toThrow(InvalidCredentialsError);
    expect(deps.repository.incrementFailedLoginAttempts).toHaveBeenCalledWith(1n, credential.id);
  });

  it("issues session tokens on a valid TOTP code", async () => {
    const deps = buildDeps();
    const credential = buildUserCredential({ isMfaEnabled: true, mfaSecret: "secret" });
    (deps.repository.findCredentialByUuid as jest.Mock).mockResolvedValue(credential);
    (deps.totpProvider.verifyToken as jest.Mock).mockReturnValue(true);

    const result = await verifyMfaChallenge(baseInput, deps);

    expect(result).toEqual({ status: "authenticated", accessToken: "access-token", refreshToken: "refresh-token" });
    expect(deps.repository.resetFailedLoginAttempts).toHaveBeenCalledWith(1n, credential.id);
    expect(deps.repository.createRefreshToken).toHaveBeenCalledTimes(1);
  });
});
