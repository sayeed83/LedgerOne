import { RoleStatus } from "../enums/role-status.enum";
import { InvalidRoleStatusTransitionError } from "../errors/authorization.errors";

// Domain aggregate root for a Role (00_BUSINESS_RULES.md Ch.11) — a
// tenant-configurable, named collection of Permissions. The constructor stays
// public (rather than a validating static factory, Ch.15.5) because the
// Repository layer's `toDomain` mapping (05_CODING_STANDARDS.md Ch.14.6) must
// reconstruct this aggregate directly from an already-valid persisted row;
// the lifecycle invariant a caller can violate (15.4) is instead enforced by
// the transition method below (Ch.15.6 — a transition returns a new instance
// rather than mutating in place), mirroring Organization's Tenant/Company
// aggregates and User Management's User aggregate.
export class Role {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly name: string,
    public readonly description: string | null,
    public readonly isSystemRole: boolean,
    public readonly status: RoleStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}

  /** Role lifecycle (00_BUSINESS_RULES.md Ch.11.5): Active → Retired — no longer assignable to new Users; existing assignments persist until reassigned (Ch.11.7 ROL-003). */
  retire(): Role {
    if (this.status !== RoleStatus.Active) {
      throw new InvalidRoleStatusTransitionError(this.status, RoleStatus.Retired);
    }
    return this.withStatus(RoleStatus.Retired);
  }

  private withStatus(status: RoleStatus): Role {
    return new Role(
      this.id,
      this.uuid,
      this.tenantId,
      this.name,
      this.description,
      this.isSystemRole,
      status,
      this.createdAt,
      this.updatedAt,
      this.createdBy,
      this.updatedBy,
      this.deletedAt,
    );
  }
}

/** Fields required to persist a new Role row; identity/timestamps/status default are assigned by the database. */
export interface CreateRoleProps {
  name: string;
  description?: string | null;
  /** LedgerOne's standard, pre-configured Roles (ROL-002) set this true; a tenant's own custom Role defaults to false. */
  isSystemRole?: boolean;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Role row; status is changed only via `retireRole`. */
export interface UpdateRoleProps {
  name?: string;
  description?: string | null;
  updatedBy?: bigint | null;
}
