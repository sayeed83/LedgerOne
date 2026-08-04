import { DecimalValue } from "../value-objects/decimal-value.value-object";

// Domain entity for an Exchange Rate (00_BUSINESS_RULES.md Ch.31) — the
// defined conversion factor between two Currencies (Ch.7) as of a specific
// date. Tenant-owned (06_DATABASE_STANDARDS.md MT-001) — rates are entered
// per Ch.31.5 for a tenant's own operations. Data shape only — no lifecycle
// transitions; Ch.31.5/EXR-002 make an Exchange Rate an immutable historical
// time series once created, so this entity (unlike FinancialYear/
// FiscalPeriod's aggregates) exposes no transition methods, mirroring
// Authorization's RolePermission/UserRole entities (created or removed,
// never partially updated).
//
// `rate` is a `DecimalValue` (domain/value-objects/decimal-value.value-object.ts),
// not a primitive string — 00_BUSINESS_RULES.md Ch.31.3/31.8 make the rate
// value's exactness a real invariant, and 03_ARCHITECTURE.md Ch.7.3.2 models
// exactly this kind of precise numeric concept as an immutable Value
// Object (the same shape Ch.7.3.6's worked `Money` example uses for its own
// `amount` field).
export class ExchangeRate {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly fromCurrencyId: bigint,
    public readonly toCurrencyId: bigint,
    public readonly rate: DecimalValue,
    public readonly effectiveDate: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Exchange Rate row; identity/timestamps are assigned by the database. */
export interface CreateExchangeRateProps {
  fromCurrencyId: bigint;
  toCurrencyId: bigint;
  rate: DecimalValue;
  effectiveDate: Date;
  createdBy?: bigint | null;
}
