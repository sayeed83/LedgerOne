// Domain-owned collaborator interface (03_ARCHITECTURE.md Decision 5.7.2).
// Business-layer use cases depend on this contract, never on `jsonwebtoken`
// directly. Claim shape follows the Authentication Module Specification
// §13/JWT-002: `sub` is the User Management user uuid, `tenantId` and
// `plane` are set only by this module at issuance (JWT-004/MTS-001) and are
// never accepted from client input anywhere in this module's business logic.
export interface AccessTokenClaims {
  sub: string;
  tenantId: string;
  plane: "tenant";
  jti: string;
}

export interface RefreshTokenClaims {
  sub: string;
  tenantId: string;
  plane: "tenant";
  jti: string;
}

/** Short-lived, self-contained claim identifying which credential is mid-MFA-challenge (spec §5's `mfaChallengeToken`). */
export interface MfaChallengeClaims {
  credentialUuid: string;
  tenantId: string;
}

export interface ITokenIssuer {
  issueAccessToken(claims: { sub: string; tenantId: string }): string;
  verifyAccessToken(token: string): AccessTokenClaims;

  issueRefreshToken(claims: { sub: string; tenantId: string; jti: string }): string;
  verifyRefreshToken(token: string): RefreshTokenClaims;

  issueMfaChallengeToken(claims: { credentialUuid: string; tenantId: string }): string;
  verifyMfaChallengeToken(token: string): MfaChallengeClaims;
}
