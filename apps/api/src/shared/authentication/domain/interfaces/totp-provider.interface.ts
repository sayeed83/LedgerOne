// Domain-owned collaborator interface (03_ARCHITECTURE.md Decision 5.7.2).
// Business-layer use cases depend on this contract, never on `speakeasy`
// directly (ADR-002 names Speakeasy as the concrete implementation).
export interface GeneratedTotpSecret {
  base32: string;
  otpauthUrl: string;
}

export interface ITotpProvider {
  generateSecret(accountLabel: string): GeneratedTotpSecret;
  verifyToken(base32Secret: string, code: string): boolean;
}
