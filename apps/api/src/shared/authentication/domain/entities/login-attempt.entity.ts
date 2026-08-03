// Domain entity for one recorded login attempt (lockout/anomaly detection
// input). Data shape only — see user-credential.aggregate.ts for the same
// rationale.
export class LoginAttempt {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly userCredentialId: bigint | null,
    public readonly emailAttempted: string,
    public readonly isSuccessful: boolean,
    public readonly sourceIp: string,
    public readonly userAgent: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

/** Fields required to persist a new login attempt; identity/timestamps are assigned by the database. */
export interface RecordLoginAttemptProps {
  tenantId: bigint;
  userCredentialId: bigint | null;
  emailAttempted: string;
  isSuccessful: boolean;
  sourceIp: string;
  userAgent?: string | null;
}
