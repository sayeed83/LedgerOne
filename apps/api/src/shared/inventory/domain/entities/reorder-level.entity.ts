// Domain entity for a Reorder Level (00_BUSINESS_RULES.md Ch.42) — a
// configured minimum Stock (Ch.38) threshold per Product per Warehouse,
// below which a replenishment action is triggered or suggested. Tenant-owned
// (06_DATABASE_STANDARDS.md MT-001), carrying `companyUuid` and
// `warehouseUuid` as cross-module/in-module uuid-reference fields (FK-002,
// no DB-level FK — mirroring Stock's/Inventory Adjustment's own identical
// treatment of both fields) and `productId` as a real, in-module FK to this
// module's own Product (inventory.prisma FK-001, mirroring Stock's own
// `productId` treatment exactly). ROL-101 ("A Reorder Level is defined per
// Product per Warehouse") is enforced by the schema's own unique constraint,
// not here. Data shape only — no lifecycle methods on this entity (mirroring
// Stock's/Batch's own entity, not aggregate, placement); Ch.42.8's
// non-negative/positive validation, reorder-alert generation, and any
// Purchase Requisition suggestion are all Business-layer (or later-chapter)
// concerns, not implemented here.
//
// `reorderLevel`/`reorderQuantity` are DECIMAL(18,6) columns
// (inventory.prisma) mapped to plain fixed-point strings, mirroring Stock's
// own quantity-field mapping — a cross-module Domain import of a shared
// `DecimalValue` type is architecturally forbidden at this layer (see
// unit.entity.ts's own header comment).
export class ReorderLevel {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly warehouseUuid: string,
    public readonly productId: bigint,
    public readonly reorderLevel: string,
    public readonly reorderQuantity: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Reorder Level row; identity/timestamps are assigned by the database. */
export interface CreateReorderLevelProps {
  companyUuid: string;
  warehouseUuid: string;
  productId: bigint;
  reorderLevel: string;
  reorderQuantity: string;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Reorder Level row. */
export interface UpdateReorderLevelProps {
  reorderLevel?: string;
  reorderQuantity?: string;
  updatedBy?: bigint | null;
}
