// Domain entity for a Unit of Measure (00_BUSINESS_RULES.md Ch.36) — the
// quantity-measurement convention for a Product (Ch.34), e.g. Pieces,
// Kilograms, Liters, Boxes, including a conversion factor to a base Unit.
// Tenant-owned (06_DATABASE_STANDARDS.md MT-001), carrying `companyUuid`
// directly (cross-module reference, FK-002, no DB-level FK), mirroring
// Product Category's own ownership shape. Data shape only — no lifecycle
// transition methods, since Ch.36.5 documents Unit as "static reference
// data" with no state machine, mirroring Product Category's own entity (not
// aggregate) placement.
//
// `conversionFactor` is a plain `string | null` here, not a Domain Value
// Object — Accounting's own `DecimalValue` (the module that owns exact-
// decimal-precision handling) cannot be imported from this module's
// Repository layer (03_ARCHITECTURE.md Ch.6.7/04_FOLDER_STRUCTURE.md
// §19.3 — only a Business layer may reach into another module, and only
// via its published contract; Repository/Domain never reach across
// modules directly). Introducing an Inventory-owned decimal Value Object
// is explicitly out of scope for this Repository-only milestone (no
// business logic/validation requested) — `.toFixed()`-mapped plain strings
// are the minimal, correct persistence-layer representation for now,
// mirroring how Exchange Rate's own `rate` column was represented before
// `DecimalValue` existed at all.
export class Unit {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly name: string,
    public readonly symbol: string,
    public readonly baseUnitId: bigint | null,
    public readonly conversionFactor: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Unit row; identity/timestamps are assigned by the database. */
export interface CreateUnitProps {
  companyUuid: string;
  name: string;
  symbol: string;
  baseUnitId?: bigint | null;
  conversionFactor?: string | null;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Unit row. */
export interface UpdateUnitProps {
  name?: string;
  symbol?: string;
  baseUnitId?: bigint | null;
  conversionFactor?: string | null;
  updatedBy?: bigint | null;
}
