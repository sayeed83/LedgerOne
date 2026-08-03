// Business layer — exchanges a valid refresh token for a new access token
// (spec §8). Does not require re-authentication or MFA; it is a
// continuation of an already-established session.
import { IAuthenticationRepository } from "../domain/interfaces/authentication-repository.interface";
import { ITokenIssuer } from "../domain/interfaces/token-issuer.interface";
import { InvalidRefreshTokenError } from "../domain/errors/authentication.errors";

export interface RefreshAccessTokenInput {
  tenantId: bigint;
  refreshToken: string;
}

export interface RefreshAccessTokenDeps {
  repository: IAuthenticationRepository;
  tokenIssuer: ITokenIssuer;
}

export interface RefreshAccessTokenResult {
  accessToken: string;
}

export async function refreshAccessToken(
  input: RefreshAccessTokenInput,
  deps: RefreshAccessTokenDeps,
): Promise<RefreshAccessTokenResult> {
  const { repository, tokenIssuer } = deps;

  let claims;
  try {
    claims = tokenIssuer.verifyRefreshToken(input.refreshToken);
  } catch {
    throw new InvalidRefreshTokenError();
  }

  if (claims.tenantId !== input.tenantId.toString()) {
    throw new InvalidRefreshTokenError();
  }

  // Defense in depth (JWT-005): a cryptographically valid but revoked/expired
  // record must still be rejected — the deny-list check is DB-backed, not
  // solely the JWT's own `exp` claim.
  const record = await repository.findValidRefreshToken(input.tenantId, claims.jti);
  if (!record) {
    throw new InvalidRefreshTokenError();
  }

  const accessToken = tokenIssuer.issueAccessToken({ sub: claims.sub, tenantId: input.tenantId.toString() });
  return { accessToken };
}
