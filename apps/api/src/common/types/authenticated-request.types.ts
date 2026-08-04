// Shared shape populated onto `req` by the cross-cutting auth middleware
// (jwt-auth.middleware.ts, current-tenant.middleware.ts). Defined
// independently here rather than importing Authentication's
// `AccessTokenClaims` (shared/authentication/domain/interfaces/token-issuer.interface.ts)
// — that interface lives under Authentication's `domain/`, not its published
// surface (`index.ts`), and 03_ARCHITECTURE.md Ch.6.7 only permits importing
// another module's explicitly published contract. `common/` sits outside the
// module-boundary rule (it is the cross-cutting substrate every module's
// Express router is mounted onto by module-registry.ts, not a peer module
// itself), so it defines its own minimal shape instead of reaching into
// Authentication's internals.
export interface AuthenticatedUser {
  userUuid: string;
  tenantId: bigint;
  tokenId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenantId?: bigint;
      correlationId?: string;
    }
  }
}

// Ensures this file is treated as a module (required for `declare global` to
// augment, rather than replace, the `Express` namespace).
export {};
