// Extracts the claimed `tenantId` from a token WITHOUT verifying its
// signature, purely so the controller has a tenant to pass into the
// Business-layer use case's `tenantId` parameter. This is not an
// authorization decision (03_ARCHITECTURE.md MTA-001 still holds): the
// Business layer re-verifies the token's signature and re-checks that its
// `tenantId` claim matches what was passed in
// (refresh-access-token.service.ts / logout.service.ts /
// verify-mfa-challenge.service.ts each do this) before trusting anything.
// An unverified/malformed token simply yields `undefined`, which the
// Business layer's own verification will then reject.
//
// Login and forgot-password/reset-password have no prior token to peek at
// (login is first contact; the reset token is an opaque DB-stored value,
// not a JWT) — those endpoints accept `tenantId` directly in the request
// body instead, as an explicitly flagged interim measure pending the
// Organization module's tenant-resolution mechanism (not yet designed
// anywhere in the handbook).
import { decode } from "jsonwebtoken";

export function peekTenantId(token: string): bigint | undefined {
  const decoded = decode(token);
  if (!decoded || typeof decoded !== "object") return undefined;
  const claim = (decoded as Record<string, unknown>).tenantId;
  if (typeof claim !== "string" || !/^\d+$/.test(claim)) return undefined;
  return BigInt(claim);
}
