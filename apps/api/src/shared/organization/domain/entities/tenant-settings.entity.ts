// Domain entity for a Tenant's organization-wide default settings
// (00_BUSINESS_RULES.md ORG-003). Data shape only — see tenant.aggregate.ts
// for the same rationale.
export class TenantSettings {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly defaultCurrencyCode: string,
    public readonly defaultTimeZone: string,
    public readonly defaultFinancialYearPattern: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new TenantSettings row; identity/timestamps are assigned by the database. */
export interface CreateTenantSettingsProps {
  defaultCurrencyCode: string;
  defaultTimeZone: string;
  defaultFinancialYearPattern: string;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing TenantSettings row. */
export interface UpdateTenantSettingsProps {
  defaultCurrencyCode?: string;
  defaultTimeZone?: string;
  defaultFinancialYearPattern?: string;
  updatedBy?: bigint | null;
}
