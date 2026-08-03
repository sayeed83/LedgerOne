import { requestPasswordReset, RequestPasswordResetDeps } from "./request-password-reset.service";
import { buildUserCredential, createFakeAuthenticationRepository, createFakeClock } from "./test-support/fixtures";

const NOW = new Date("2026-01-15T12:00:00.000Z");

function buildDeps(): RequestPasswordResetDeps {
  return { repository: createFakeAuthenticationRepository(), clock: createFakeClock(NOW) };
}

const baseInput = { tenantId: 1n, email: "user@example.com" };

describe("requestPasswordReset", () => {
  it("returns an empty result and creates nothing when the email does not exist (enumeration-safe)", async () => {
    const deps = buildDeps();
    (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(null);

    const result = await requestPasswordReset(baseInput, deps);

    expect(result).toEqual({});
    expect(deps.repository.createPasswordResetToken).not.toHaveBeenCalled();
  });

  it("creates a hashed, 15-minute-expiring token and returns the plaintext token when the email exists", async () => {
    const deps = buildDeps();
    const credential = buildUserCredential();
    (deps.repository.findCredentialByEmail as jest.Mock).mockResolvedValue(credential);

    const result = await requestPasswordReset(baseInput, deps);

    expect(result.resetToken).toMatch(/^[0-9a-f]{64}$/);
    expect(deps.repository.createPasswordResetToken).toHaveBeenCalledTimes(1);
    const [tenantId, props] = (deps.repository.createPasswordResetToken as jest.Mock).mock.calls[0];
    expect(tenantId).toBe(1n);
    expect(props.userCredentialId).toBe(credential.id);
    expect(props.tokenHash).not.toBe(result.resetToken);
    expect(props.expiresAt).toEqual(new Date("2026-01-15T12:15:00.000Z"));
  });
});
