import { refreshAccessToken, RefreshAccessTokenDeps } from "./refresh-access-token.service";
import { InvalidRefreshTokenError } from "../domain/errors/authentication.errors";
import { ITokenIssuer } from "../domain/interfaces/token-issuer.interface";
import { buildRefreshToken, createFakeAuthenticationRepository } from "./test-support/fixtures";

function buildDeps(): RefreshAccessTokenDeps {
  const tokenIssuer: jest.Mocked<ITokenIssuer> = {
    issueAccessToken: jest.fn().mockReturnValue("new-access-token"),
    verifyAccessToken: jest.fn(),
    issueRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn().mockReturnValue({ sub: "user-uuid", tenantId: "1", plane: "tenant", jti: "jti-1" }),
    issueMfaChallengeToken: jest.fn(),
    verifyMfaChallengeToken: jest.fn(),
  };
  return { repository: createFakeAuthenticationRepository(), tokenIssuer };
}

const baseInput = { tenantId: 1n, refreshToken: "refresh-jwt" };

describe("refreshAccessToken", () => {
  it("throws InvalidRefreshTokenError when the token fails signature/expiry verification", async () => {
    const deps = buildDeps();
    (deps.tokenIssuer.verifyRefreshToken as jest.Mock).mockImplementation(() => {
      throw new Error("expired");
    });

    await expect(refreshAccessToken(baseInput, deps)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it("throws InvalidRefreshTokenError when the token's tenant claim does not match", async () => {
    const deps = buildDeps();
    (deps.tokenIssuer.verifyRefreshToken as jest.Mock).mockReturnValue({
      sub: "user-uuid",
      tenantId: "2",
      plane: "tenant",
      jti: "jti-1",
    });

    await expect(refreshAccessToken(baseInput, deps)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it("throws InvalidRefreshTokenError when the DB record has been revoked or expired", async () => {
    const deps = buildDeps();
    (deps.repository.findValidRefreshToken as jest.Mock).mockResolvedValue(null);

    await expect(refreshAccessToken(baseInput, deps)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it("issues a new access token when the refresh token is valid", async () => {
    const deps = buildDeps();
    (deps.repository.findValidRefreshToken as jest.Mock).mockResolvedValue(buildRefreshToken());

    const result = await refreshAccessToken(baseInput, deps);

    expect(result).toEqual({ accessToken: "new-access-token" });
    expect(deps.repository.findValidRefreshToken).toHaveBeenCalledWith(1n, "jti-1");
  });
});
