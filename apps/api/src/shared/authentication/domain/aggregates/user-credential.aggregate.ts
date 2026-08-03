// Domain aggregate root for a login credential. Data shape only — no
// invariants/behavior methods yet; those belong to the Business-layer
// milestone. Kept here (rather than the Repository layer) so the Repository
// never returns an ORM/Prisma type (03_ARCHITECTURE.md Ch.5.3.4).
export class UserCredential {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly userUuid: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly isMfaEnabled: boolean,
    public readonly mfaSecret: string | null,
    public readonly failedLoginCount: number,
    public readonly lockedUntil: Date | null,
    public readonly lastLoginAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new credential; identity/timestamps/defaults are assigned by the database. */
export interface CreateUserCredentialProps {
  tenantId: bigint;
  userUuid: string;
  email: string;
  passwordHash: string;
  createdBy?: bigint | null;
}
