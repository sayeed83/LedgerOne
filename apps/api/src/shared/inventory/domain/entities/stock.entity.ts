// Domain entity for Stock (00_BUSINESS_RULES.md Ch.38) — the quantity of a
// Product physically held in a Warehouse: on-hand, reserved, and available
// balances (Ch.38.3/38.11). Tenant-owned (06_DATABASE_STANDARDS.md MT-001),
// carrying `companyUuid` and `warehouseUuid` as cross-module/in-module
// uuid-reference fields (FK-002, no DB-level FK — mirroring Warehouse's own
// `branchUuid` reference shape) and `productId` as a real, in-module FK to
// this module's own Product (inventory.prisma FK-001). STK-003 ("at most one
// Stock row per Product per Warehouse") is enforced by the schema's own
// unique constraint, not here. Data shape only — no lifecycle or arithmetic
// methods on this entity (mirroring Product's/Warehouse's own entity, not
// aggregate, placement); STK-001's on-hand/reserved/available arithmetic and
// every quantity validation are Business-layer concerns for a later
// milestone, not implemented here.
//
// Quantity fields are DECIMAL(18,6) columns (inventory.prisma) mapped to
// plain fixed-point strings, mirroring Unit's own `conversionFactor` mapping
// — a cross-module Domain import of a shared `DecimalValue` type is
// architecturally forbidden at this layer (see unit.entity.ts's own header
// comment).
export class Stock {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly warehouseUuid: string,
    public readonly productId: bigint,
    public readonly quantityOnHand: string,
    public readonly quantityReserved: string,
    public readonly quantityAvailable: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Stock row; identity/timestamps are assigned by the database. */
export interface CreateStockProps {
  companyUuid: string;
  warehouseUuid: string;
  productId: bigint;
  quantityOnHand?: string;
  quantityReserved?: string;
  quantityAvailable?: string;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Stock row. */
export interface UpdateStockProps {
  quantityOnHand?: string;
  quantityReserved?: string;
  quantityAvailable?: string;
  updatedBy?: bigint | null;
}
