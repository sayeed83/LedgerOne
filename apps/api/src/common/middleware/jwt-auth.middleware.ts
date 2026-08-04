// Cross-cutting infrastructure (03_ARCHITECTURE.md Ch.9/09_SECURITY_GUIDELINES.md
// AUTHN-*): verifies the RS256 access token on the `Authorization: Bearer`
// header and populates `req.user` with its claims. This is the missing
// enforcement point flagged by the Foundation Readiness Review — until now
// no middleware verified a token on any request anywhere in the app.
//
// Takes a structurally-typed `AccessTokenVerifier` rather than importing
// Authentication's own `ITokenIssuer` — scripts/lint/check-module-imports.ts
// mechanically enforces 04_FOLDER_STRUCTURE.md Section 19.3: `common/` may
// never import any module-specific folder, no exception (an earlier version
// of this file did import Authentication's internals directly and was
// rejected by that check). Authentication's own `JwtTokenIssuer` already
// satisfies this shape structurally, so `module-registry.ts` — which *is*
// allowed to import a module's published entry point, and already does —
// passes it in directly; no cast or adapter needed on Authentication's side.
import { NextFunction, Request, Response } from "express";
import { TokenExpiredError } from "jsonwebtoken";

export interface AccessTokenVerifier {
  verifyAccessToken(token: string): { sub: string; tenantId: string; jti: string };
}

const BEARER_PREFIX = "Bearer ";

export function createJwtAuthMiddleware(tokenVerifier: AccessTokenVerifier) {
  return function jwtAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;

    if (!header || !header.startsWith(BEARER_PREFIX)) {
      res
        .status(401)
        .json({ error: { code: "AUTH_MISSING_TOKEN", message: "A valid Authorization: Bearer token is required." } });
      return;
    }

    const token = header.slice(BEARER_PREFIX.length);

    try {
      const claims = tokenVerifier.verifyAccessToken(token);
      req.user = {
        userUuid: claims.sub,
        tenantId: BigInt(claims.tenantId),
        tokenId: claims.jti,
      };
      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        res.status(401).json({ error: { code: "AUTH_TOKEN_EXPIRED", message: "The access token has expired." } });
        return;
      }
      res.status(401).json({ error: { code: "AUTH_INVALID_TOKEN", message: "The access token is invalid." } });
    }
  };
}
