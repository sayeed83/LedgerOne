import { TenantStatus } from "../enums/tenant-status.enum";
import { InvalidTenantStatusTransitionError } from "../errors/organization.errors";

// Domain aggregate root for the tenant registry (Organization =
// Tenant, 00_BUSINESS_RULES.md Ch.1.3). The constructor stays public (rather
// than a validating static factory, Ch.15.5) because the Repository layer's
// `toDomain` mapping (05_CODING_STANDARDS.md Ch.14.6) must reconstruct this
// aggregate directly from an already-valid persisted row; the lifecycle
// invariants a caller can violate (15.4) are instead enforced by the
// transition methods below (05_CODING_STANDARDS.md Ch.15.6 — a transition
// returns a new instance rather than mutating in place).
export class Tenant {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly legalName: string,
    public readonly primaryContactEmail: string,
    public readonly status: TenantStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}

  /** Organization lifecycle (00_BUSINESS_RULES.md Ch.1.6): Provisioning/Suspended → Active. */
  activate(): Tenant {
    if (this.status !== TenantStatus.Provisioning && this.status !== TenantStatus.Suspended) {
      throw new InvalidTenantStatusTransitionError(this.status, TenantStatus.Active);
    }
    return this.withStatus(TenantStatus.Active);
  }

  /** Organization lifecycle (00_BUSINESS_RULES.md Ch.1.6): Active → Suspended (subscription lapse/payment failure). */
  suspend(): Tenant {
    if (this.status !== TenantStatus.Active) {
      throw new InvalidTenantStatusTransitionError(this.status, TenantStatus.Suspended);
    }
    return this.withStatus(TenantStatus.Suspended);
  }

  /** Organization lifecycle (00_BUSINESS_RULES.md Ch.1.6): Active/Suspended → Deactivated. Deactivated is terminal — never a valid `from` state. */
  deactivate(): Tenant {
    if (this.status !== TenantStatus.Active && this.status !== TenantStatus.Suspended) {
      throw new InvalidTenantStatusTransitionError(this.status, TenantStatus.Deactivated);
    }
    return this.withStatus(TenantStatus.Deactivated);
  }

  private withStatus(status: TenantStatus): Tenant {
    return new Tenant(
      this.id,
      this.uuid,
      this.legalName,
      this.primaryContactEmail,
      status,
      this.createdAt,
      this.updatedAt,
      this.createdBy,
      this.updatedBy,
      this.deletedAt,
    );
  }
}

/** Fields required to persist a new Tenant; identity/timestamps/defaults are assigned by the database. */
export interface CreateTenantProps {
  legalName: string;
  primaryContactEmail: string;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Tenant; status is changed only via `updateTenantStatus`. */
export interface UpdateTenantProps {
  legalName?: string;
  primaryContactEmail?: string;
  updatedBy?: bigint | null;
}
