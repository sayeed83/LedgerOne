import { AdjustmentType } from "../enums/adjustment-type.enum";

// Domain entity for an Inventory Adjustment (00_BUSINESS_RULES.md Ch.44) — a
// manual correction to a Product's Stock (Ch.38) quantity in a Warehouse,
// arising from a physical count reconciliation, damage, loss, or theft.
// Tenant-owned (06_DATABASE_STANDARDS.md MT-001), carrying `companyUuid` and
// `warehouseUuid` as cross-module/in-module uuid-reference fields (FK-002,
// no DB-level FK — mirroring Stock's own identical treatment of both
// fields) and `productId` as a real, in-module FK to this module's own
// Product (inventory.prisma FK-001). Data shape only — no lifecycle,
// approval-threshold (ADJ-003/Ch.13), or Stock-application arithmetic on
// this entity (mirroring Product's/Warehouse's/Stock's own entity, not
// aggregate, placement); those are Business-layer concerns for a later
// milestone, not implemented here.
//
// `quantity` is a DECIMAL(18,6) column (inventory.prisma) mapped to a plain
// fixed-point string, mirroring Stock's own quantity-field mapping — a
// cross-module Domain import of a shared `DecimalValue` type is
// architecturally forbidden at this layer (see unit.entity.ts's own header
// comment).
export class InventoryAdjustment {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly warehouseUuid: string,
    public readonly productId: bigint,
    public readonly adjustmentType: AdjustmentType,
    public readonly quantity: string,
    public readonly reason: string,
    public readonly remarks: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Inventory Adjustment row; identity/timestamps are assigned by the database. */
export interface CreateInventoryAdjustmentProps {
  companyUuid: string;
  warehouseUuid: string;
  productId: bigint;
  adjustmentType: AdjustmentType;
  quantity: string;
  reason: string;
  remarks?: string | null;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Inventory Adjustment row. */
export interface UpdateInventoryAdjustmentProps {
  adjustmentType?: AdjustmentType;
  quantity?: string;
  reason?: string;
  remarks?: string | null;
  updatedBy?: bigint | null;
}
