// Domain entity for a single-use password reset token. Data shape only —
// see user-credential.aggregate.ts for the same rationale.
export class PasswordResetToken {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly userCredentialId: bigint,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly usedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

/** Fields required to persist a new reset token; identity/timestamps are assigned by the database. */
export interface CreatePasswordResetTokenProps {
  tenantId: bigint;
  userCredentialId: bigint;
  tokenHash: string;
  expiresAt: Date;
}
