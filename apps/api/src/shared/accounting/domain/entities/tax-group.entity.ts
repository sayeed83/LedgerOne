// Domain entity for a Tax Group (00_BUSINESS_RULES.md Ch.67) — a named tax
// classification (e.g. "Standard Rate", "Zero Rate", "Exempt") applied to
// Products/Product Categories, determining which Tax Rule (Ch.68) applies.
// Tenant-owned (06_DATABASE_STANDARDS.md MT-001), carrying `companyUuid`
// directly (cross-module reference, FK-002, no DB-level FK), mirroring
// FinancialYear's own ownership shape. Data shape only — no lifecycle
// transition methods, since Ch.67.5 documents Tax Group as "static,
// low-change reference data" with no state machine (unlike Currency's
// Active/Inactive lifecycle); a plain entity, not an aggregate, mirroring
// ExchangeRate's own placement rationale. Unlike ExchangeRate, a Tax Group
// may be revised (Ch.67.5 — "updated primarily in response to regulatory
// change"), so this entity's Repository counterpart provides an update
// method.
export class TaxGroup {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Tax Group row; identity/timestamps are assigned by the database. */
export interface CreateTaxGroupProps {
  companyUuid: string;
  name: string;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Tax Group row. */
export interface UpdateTaxGroupProps {
  name?: string;
  updatedBy?: bigint | null;
}
