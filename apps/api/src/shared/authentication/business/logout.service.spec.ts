import { logout, LogoutDeps } from "./logout.service";
import { InvalidRefreshTokenError } from "../domain/errors/authentication.errors";
import { ITokenIssuer } from "../domain/interfaces/token-issuer.interface";
import { buildRefreshToken, createFakeAuthenticationRepository } from "./test-support/fixtures";

function buildDeps(): LogoutDeps {
  const tokenIssuer: jest.Mocked<ITokenIssuer> = {
    issueAccessToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    issueRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn().mockReturnValue({ sub: "user-uuid", tenantId: "1", plane: "tenant", jti: "jti-1" }),
    issueMfaChallengeToken: jest.fn(),
    verifyMfaChallengeToken: jest.fn(),
  };
  return { repository: createFakeAuthenticationRepository(), tokenIssuer };
}

const baseInput = { tenantId: 1n, refreshToken: "refresh-jwt" };

describe("logout", () => {
  it("throws InvalidRefreshTokenError when the token fails verification", async () => {
    const deps = buildDeps();
    (deps.tokenIssuer.verifyRefreshToken as jest.Mock).mockImplementation(() => {
      throw new Error("bad token");
    });

    await expect(logout(baseInput, deps)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it("is a no-op when the session record is already gone", async () => {
    const deps = buildDeps();
    (deps.repository.findValidRefreshToken as jest.Mock).mockResolvedValue(null);

    await expect(logout(baseInput, deps)).resolves.toBeUndefined();
    expect(deps.repository.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it("revokes the matching session record", async () => {
    const deps = buildDeps();
    const record = buildRefreshToken({ id: 42n });
    (deps.repository.findValidRefreshToken as jest.Mock).mockResolvedValue(record);

    await logout(baseInput, deps);

    expect(deps.repository.revokeRefreshToken).toHaveBeenCalledWith(1n, 42n);
  });
});
