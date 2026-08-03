// Domain entity for a revocable refresh-token session record. Data shape
// only — see user-credential.aggregate.ts for the same rationale.
export class RefreshToken {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly userCredentialId: bigint,
    public readonly jti: string,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
    public readonly createdFromIp: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

/** Fields required to persist a new refresh token; identity/timestamps are assigned by the database. */
export interface CreateRefreshTokenProps {
  tenantId: bigint;
  userCredentialId: bigint;
  jti: string;
  expiresAt: Date;
  createdFromIp: string;
}
