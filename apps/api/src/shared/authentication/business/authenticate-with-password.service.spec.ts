import { authenticateWithPassword, AuthenticateWithPasswordDeps } from "./authenticate-with-password.service";
import { AccountLockedError, InvalidCredentialsError } from "../domain/errors/authentication.errors";
import { IPasswordHasher } from "../domain/interfaces/password-hasher.interface";
import { ITokenIssuer } from "../domain/interfaces/token-issuer.interface";
import { buildUserCredential, createFakeAuthenticationRepository, createFakeClock } from "./test-support/fixtures";

const NOW = new Date("2026-01-15T12:00:00.000Z");

function buildDeps(): AuthenticateWithPasswordDeps {
  const passwordHasher: jest.Mocked<IPasswordHasher> = { hash: jest.fn(), verify: jest.fn() };
  const tokenIssuer: jest.Mocked<ITokenIssuer> = {
    issueAccessToken: jest.fn().mockReturnValue("access-token"),
    verifyAccessToken: jest.fn(),
    issueRefreshToken: jest.fn().mockReturnValue("refresh-token"),
    verifyRefreshToken: jest.fn(),
    issueMfaChallengeToken: jest.fn().mockReturnValue("mfa-challenge-token"),
    verifyMfaChallengeToken: jest.fn(),
  };
  return {
    repository: createFakeAuthenticationRepository(),
    passwordHasher,
    tokenIssuer,
    clock: createFakeClock(NOW),
  };
}

const baseInput = { tenantId: 1n, email: "user@example.com", password: "correct-horse-battery", sourceIp: "127.0.0.1" };

describe("authenticateWithPassword", () => {
  it("throws InvalidCredentialsError and records a linkless attempt when the email does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(null);

    await expect(authenticateWithPassword(baseInput, deps)).rejects.toThrow(InvalidCredentialsError);

    expect(deps.repository.recordLoginAttempt).toHaveBeenCalledWith(1n, {
      tenantId: 1n,
      userCredentialId: null,
      emailAttempted: baseInput.email,
      isSuccessful: false,
      sourceIp: baseInput.sourceIp,
      userAgent: undefined,
    });
  });

  it("throws AccountLockedError when the account is currently locked", async () => {
    const deps = buildDeps();
    const credential = buildUserCredential({ lockedUntil: new Date("2026-01-15T12:10:00.000Z") });
    (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(credential);

    await expect(authenticateWithPassword(baseInput, deps)).rejects.toThrow(AccountLockedError);
    expect(deps.passwordHasher.verify).not.toHaveBeenCalled();
  });

  it("throws InvalidCredentialsError and increments the failure counter on a wrong password", async () => {
    const deps = buildDeps();
    const credential = buildUserCredential({ failedLoginCount: 3 });
    (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(credential);
    (deps.passwordHasher.verify as jest.Mock).mockResolvedValue(false);
    (deps.repository.incrementFailedLoginAttempts as jest.Mock).mockResolvedValue(
      buildUserCredential({ failedLoginCount: 4 }),
    );

    await expect(authenticateWithPassword(baseInput, deps)).rejects.toThrow(InvalidCredentialsError);

    expect(deps.repository.incrementFailedLoginAttempts).toHaveBeenCalledWith(1n, credential.id);
    expect(deps.repository.lockAccount).not.toHaveBeenCalled();
  });

  it("locks the account once the failure counter reaches the threshold", async () => {
    const deps = buildDeps();
    const credential = buildUserCredential({ failedLoginCount: 9 });
    (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(credential);
    (deps.passwordHasher.verify as jest.Mock).mockResolvedValue(false);
    (deps.repository.incrementFailedLoginAttempts as jest.Mock).mockResolvedValue(
      buildUserCredential({ failedLoginCount: 10 }),
    );

    await expect(authenticateWithPassword(baseInput, deps)).rejects.toThrow(InvalidCredentialsError);

    expect(deps.repository.lockAccount).toHaveBeenCalledWith(1n, credential.id, new Date("2026-01-15T12:15:00.000Z"));
  });

  it("returns an mfa_required result without issuing a refresh token when MFA is enabled", async () => {
    const deps = buildDeps();
    const credential = buildUserCredential({ isMfaEnabled: true, mfaSecret: "secret" });
    (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(credential);
    (deps.passwordHasher.verify as jest.Mock).mockResolvedValue(true);

    const result = await authenticateWithPassword(baseInput, deps);

    expect(result).toEqual({ status: "mfa_required", mfaChallengeToken: "mfa-challenge-token" });
    expect(deps.repository.createRefreshToken).not.toHaveBeenCalled();
    expect(deps.repository.resetFailedLoginAttempts).toHaveBeenCalledWith(1n, credential.id);
  });

  it("issues both tokens and persists the refresh token when MFA is disabled", async () => {
    const deps = buildDeps();
    const credential = buildUserCredential({ isMfaEnabled: false });
    (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(credential);
    (deps.passwordHasher.verify as jest.Mock).mockResolvedValue(true);

    const result = await authenticateWithPassword(baseInput, deps);

    expect(result).toEqual({ status: "authenticated", accessToken: "access-token", refreshToken: "refresh-token" });
    expect(deps.repository.createRefreshToken).toHaveBeenCalledTimes(1);
    const [tenantId, props] = (deps.repository.createRefreshToken as jest.Mock).mock.calls[0];
    expect(tenantId).toBe(1n);
    expect(props.userCredentialId).toBe(credential.id);
    expect(props.createdFromIp).toBe(baseInput.sourceIp);
  });
});
