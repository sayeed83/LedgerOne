import { UserStatus } from "../enums/user-status.enum";
import { InvalidUserStatusTransitionError } from "../errors/user-management.errors";

// Domain aggregate root for the canonical human identity (00_BUSINESS_RULES.md
// Ch.10.1). The constructor stays public (rather than a validating static
// factory, Ch.15.5) because the Repository layer's `toDomain` mapping
// (05_CODING_STANDARDS.md Ch.14.6) must reconstruct this aggregate directly
// from an already-valid persisted row; the lifecycle invariants a caller can
// violate (15.4) are instead enforced by the transition methods below
// (Ch.15.6 — a transition returns a new instance rather than mutating in
// place), mirroring Organization's Tenant/Company aggregates.
export class User {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly branchUuid: string | null,
    public readonly departmentUuid: string | null,
    public readonly firstName: string,
    public readonly middleName: string | null,
    public readonly lastName: string,
    public readonly displayName: string | null,
    public readonly email: string,
    public readonly mobileNumber: string | null,
    public readonly status: UserStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}

  /** User lifecycle (00_BUSINESS_RULES.md Ch.10.5): Invited → Active (onboarding), or Suspended → Active (reinstated). */
  activate(): User {
    if (this.status !== UserStatus.Invited && this.status !== UserStatus.Suspended) {
      throw new InvalidUserStatusTransitionError(this.status, UserStatus.Active);
    }
    return this.withStatus(UserStatus.Active);
  }

  /** User lifecycle (00_BUSINESS_RULES.md Ch.10.5): Active → Suspended (e.g., leave of absence). */
  suspend(): User {
    if (this.status !== UserStatus.Active) {
      throw new InvalidUserStatusTransitionError(this.status, UserStatus.Suspended);
    }
    return this.withStatus(UserStatus.Suspended);
  }

  /** User lifecycle (00_BUSINESS_RULES.md Ch.10.5): Active → Deactivated (offboarded). Deactivated is terminal — never a valid `from` state. */
  deactivate(): User {
    if (this.status !== UserStatus.Active) {
      throw new InvalidUserStatusTransitionError(this.status, UserStatus.Deactivated);
    }
    return this.withStatus(UserStatus.Deactivated);
  }

  private withStatus(status: UserStatus): User {
    return new User(
      this.id,
      this.uuid,
      this.tenantId,
      this.companyUuid,
      this.branchUuid,
      this.departmentUuid,
      this.firstName,
      this.middleName,
      this.lastName,
      this.displayName,
      this.email,
      this.mobileNumber,
      status,
      this.createdAt,
      this.updatedAt,
      this.createdBy,
      this.updatedBy,
      this.deletedAt,
    );
  }
}

/** Fields required to persist a new User row; identity/timestamps/status default are assigned by the database. */
export interface CreateUserProps {
  companyUuid: string;
  branchUuid?: string | null;
  departmentUuid?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  displayName?: string | null;
  email: string;
  mobileNumber?: string | null;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing User row; status is changed only via `activateUser`/`suspendUser`/`deactivateUser`. */
export interface UpdateUserProps {
  companyUuid?: string;
  branchUuid?: string | null;
  departmentUuid?: string | null;
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  displayName?: string | null;
  email?: string;
  mobileNumber?: string | null;
  updatedBy?: bigint | null;
}
