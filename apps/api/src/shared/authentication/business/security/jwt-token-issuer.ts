import { randomUUID } from "crypto";
import * as jwt from "jsonwebtoken";
import {
  AccessTokenClaims,
  ITokenIssuer,
  MfaChallengeClaims,
  RefreshTokenClaims,
} from "../../domain/interfaces/token-issuer.interface";

// AUTHN-002: access token 15 min, refresh token 7 days. Challenge token is
// this module's own addition (spec §5 names the concept, not a TTL) — kept
// short since it only bridges the password step to the MFA step of one login.
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const MFA_CHALLENGE_TOKEN_TTL_SECONDS = 5 * 60;

export interface JwtTokenIssuerKeys {
  accessTokenPrivateKey: string;
  accessTokenPublicKey: string;
  refreshTokenPrivateKey: string;
  refreshTokenPublicKey: string;
}

/** ADR-001: RS256, dedicated keypair per token type, `JWT_*`/`REFRESH_TOKEN_*` env vars — never `_SECRET`-style HS256. */
export class JwtTokenIssuer implements ITokenIssuer {
  constructor(private readonly keys: JwtTokenIssuerKeys) {}

  issueAccessToken(claims: { sub: string; tenantId: string }): string {
    const payload: Omit<AccessTokenClaims, "jti"> = { sub: claims.sub, tenantId: claims.tenantId, plane: "tenant" };
    return jwt.sign({ ...payload, jti: randomUUID() }, this.keys.accessTokenPrivateKey, {
      algorithm: "RS256",
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    return jwt.verify(token, this.keys.accessTokenPublicKey, { algorithms: ["RS256"] }) as unknown as AccessTokenClaims;
  }

  issueRefreshToken(claims: { sub: string; tenantId: string; jti: string }): string {
    const payload: RefreshTokenClaims = { ...claims, plane: "tenant" };
    return jwt.sign(payload, this.keys.refreshTokenPrivateKey, {
      algorithm: "RS256",
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    });
  }

  verifyRefreshToken(token: string): RefreshTokenClaims {
    return jwt.verify(token, this.keys.refreshTokenPublicKey, {
      algorithms: ["RS256"],
    }) as unknown as RefreshTokenClaims;
  }

  issueMfaChallengeToken(claims: { credentialUuid: string; tenantId: string }): string {
    return jwt.sign(claims, this.keys.accessTokenPrivateKey, {
      algorithm: "RS256",
      expiresIn: MFA_CHALLENGE_TOKEN_TTL_SECONDS,
    });
  }

  verifyMfaChallengeToken(token: string): MfaChallengeClaims {
    return jwt.verify(token, this.keys.accessTokenPublicKey, {
      algorithms: ["RS256"],
    }) as unknown as MfaChallengeClaims;
  }
}
