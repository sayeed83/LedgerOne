import { DecimalValue } from "../value-objects/decimal-value.value-object";

// Domain entity for a Tax Rule (00_BUSINESS_RULES.md Ch.68) — the specific
// calculation logic (rate, effective date range) a Tax Group (Ch.67) maps
// to. Tenant-owned (06_DATABASE_STANDARDS.md MT-001), mirroring its parent
// Tax Group's ownership. Data shape only — no lifecycle transitions;
// TXR-003 ("a rate correction requires a new, dated rule") makes a Tax Rule
// an immutable historical/versioned record once created, mirroring
// ExchangeRate's own Ch.31.5/EXR-002 immutability, so this entity exposes
// no transition/update methods.
//
// `rate` is a `DecimalValue` (domain/value-objects/decimal-value.value-object.ts),
// not a primitive string — mirroring ExchangeRate.rate's own reasoning
// (00_BUSINESS_RULES.md Ch.68.1/68.7 make the rate value's exactness a real
// invariant).
export class TaxRule {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly taxGroupId: bigint,
    public readonly rate: DecimalValue,
    public readonly effectiveFrom: Date,
    public readonly effectiveTo: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Tax Rule row; identity/timestamps are assigned by the database. */
export interface CreateTaxRuleProps {
  taxGroupId: bigint;
  rate: DecimalValue;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  createdBy?: bigint | null;
}
