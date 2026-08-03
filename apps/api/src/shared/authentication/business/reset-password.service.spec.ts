import { resetPassword, ResetPasswordDeps } from "./reset-password.service";
import { InvalidPasswordResetTokenError, PasswordPolicyViolationError } from "../domain/errors/authentication.errors";
import { IPasswordHasher } from "../domain/interfaces/password-hasher.interface";
import { hashResetToken } from "./security/reset-token";
import { buildPasswordResetToken, createFakeAuthenticationRepository, createFakeClock } from "./test-support/fixtures";

const NOW = new Date("2026-01-15T12:00:00.000Z");
const PLAINTEXT_TOKEN = "a".repeat(64);

function buildDeps(): ResetPasswordDeps {
  const passwordHasher: jest.Mocked<IPasswordHasher> = {
    hash: jest.fn().mockResolvedValue("new-hashed-password"),
    verify: jest.fn(),
  };
  return { repository: createFakeAuthenticationRepository(), passwordHasher, clock: createFakeClock(NOW) };
}

const validNewPassword = "a-valid-new-password";

describe("resetPassword", () => {
  it("throws PasswordPolicyViolationError for a too-short password without touching the repository", async () => {
    const deps = buildDeps();

    await expect(
      resetPassword({ tenantId: 1n, token: PLAINTEXT_TOKEN, newPassword: "short" }, deps),
    ).rejects.toThrow(PasswordPolicyViolationError);
    expect(deps.repository.findPasswordResetToken).not.toHaveBeenCalled();
  });

  it("throws InvalidPasswordResetTokenError when no matching token exists", async () => {
    const deps = buildDeps();
    (deps.repository.findPasswordResetToken as jest.Mock).mockResolvedValue(null);

    await expect(
      resetPassword({ tenantId: 1n, token: PLAINTEXT_TOKEN, newPassword: validNewPassword }, deps),
    ).rejects.toThrow(InvalidPasswordResetTokenError);
  });

  it("throws InvalidPasswordResetTokenError when the token was already used", async () => {
    const deps = buildDeps();
    (deps.repository.findPasswordResetToken as jest.Mock).mockResolvedValue(
      buildPasswordResetToken({ usedAt: new Date("2026-01-15T11:00:00.000Z") }),
    );

    await expect(
      resetPassword({ tenantId: 1n, token: PLAINTEXT_TOKEN, newPassword: validNewPassword }, deps),
    ).rejects.toThrow(InvalidPasswordResetTokenError);
  });

  it("throws InvalidPasswordResetTokenError when the token has expired", async () => {
    const deps = buildDeps();
    (deps.repository.findPasswordResetToken as jest.Mock).mockResolvedValue(
      buildPasswordResetToken({ expiresAt: new Date("2026-01-15T11:59:59.000Z") }),
    );

    await expect(
      resetPassword({ tenantId: 1n, token: PLAINTEXT_TOKEN, newPassword: validNewPassword }, deps),
    ).rejects.toThrow(InvalidPasswordResetTokenError);
  });

  it("hashes the new password, marks the token used, and revokes every session on success", async () => {
    const deps = buildDeps();
    const record = buildPasswordResetToken({
      userCredentialId: 7n,
      id: 99n,
      expiresAt: new Date("2026-01-15T12:15:00.000Z"),
    });
    (deps.repository.findPasswordResetToken as jest.Mock).mockResolvedValue(record);

    await resetPassword({ tenantId: 1n, token: PLAINTEXT_TOKEN, newPassword: validNewPassword }, deps);

    expect(deps.repository.findPasswordResetToken).toHaveBeenCalledWith(1n, hashResetToken(PLAINTEXT_TOKEN));
    expect(deps.passwordHasher.hash).toHaveBeenCalledWith(validNewPassword);
    expect(deps.repository.updatePasswordHash).toHaveBeenCalledWith(1n, 7n, "new-hashed-password");
    expect(deps.repository.markPasswordResetTokenUsed).toHaveBeenCalledWith(1n, 99n);
    expect(deps.repository.revokeAllRefreshTokens).toHaveBeenCalledWith(1n, 7n);
  });
});
