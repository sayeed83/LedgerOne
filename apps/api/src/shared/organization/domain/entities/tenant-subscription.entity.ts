import { TenantSubscriptionStatus } from "../enums/tenant-subscription-status.enum";

// Domain entity for a Tenant's commercial subscription record
// (00_BUSINESS_RULES.md Ch.1.4/ORG-004). Data shape only — see
// tenant.aggregate.ts for the same rationale.
export class TenantSubscription {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly planCode: string,
    public readonly subscribedModules: string[],
    public readonly status: TenantSubscriptionStatus,
    public readonly currentPeriodStartsAt: Date,
    public readonly currentPeriodEndsAt: Date,
    public readonly cancelledAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new TenantSubscription row; identity/timestamps/defaults are assigned by the database. */
export interface CreateTenantSubscriptionProps {
  planCode: string;
  subscribedModules: string[];
  currentPeriodStartsAt: Date;
  currentPeriodEndsAt: Date;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing TenantSubscription row; status is changed only via `updateTenantStatus`-style dedicated calls at the Business layer. */
export interface UpdateTenantSubscriptionProps {
  planCode?: string;
  subscribedModules?: string[];
  status?: TenantSubscriptionStatus;
  currentPeriodStartsAt?: Date;
  currentPeriodEndsAt?: Date;
  cancelledAt?: Date | null;
  updatedBy?: bigint | null;
}
