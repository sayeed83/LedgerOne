import { BatchStatus } from "../enums/batch-status.enum";

// Domain entity for a Batch/Lot (00_BUSINESS_RULES.md Ch.40) — a specific
// production or procurement grouping of a Product (Ch.34), sharing a common
// manufacture date, expiry date, or supplier lot number, tracked separately
// within overall Stock (Ch.38) for traceability and expiry-management
// purposes. Tenant-owned (06_DATABASE_STANDARDS.md MT-001), carrying
// `companyUuid`/`warehouseUuid` as cross-module/in-module uuid-reference
// fields (FK-002, no DB-level FK — mirroring Stock's/Inventory Adjustment's
// own identical treatment of both fields) and `productId` as a real,
// in-module FK to this module's own Product (inventory.prisma FK-001, per
// Ch.40.10's `PRODUCT ||--o{ BATCH` ERD). Data shape only — no lifecycle
// transition methods on this entity itself (mirroring Product's/Warehouse's/
// Stock's own entity, not aggregate, placement); BAT-001 (every Stock
// Movement of a Batch-tracked Product must reference a Batch), BAT-002
// (FEFO issue selection), BAT-003 (expired-Batch block/override), and
// Ch.40.8's expiry-after-manufacture validation are all Business-layer
// concerns for a later milestone, not implemented here.
//
// `quantity` is a DECIMAL(18,6) column (inventory.prisma) mapped to a plain
// fixed-point string, mirroring Stock's/Inventory Adjustment's own
// quantity-field mapping — a cross-module Domain import of a shared
// `DecimalValue` type is architecturally forbidden at this layer (see
// unit.entity.ts's own header comment).
export class Batch {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly productId: bigint,
    public readonly warehouseUuid: string,
    public readonly batchNumber: string,
    public readonly manufactureDate: Date | null,
    public readonly expiryDate: Date | null,
    public readonly quantity: string,
    public readonly status: BatchStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Batch row; identity/timestamps are assigned by the database. */
export interface CreateBatchProps {
  companyUuid: string;
  productId: bigint;
  warehouseUuid: string;
  batchNumber: string;
  manufactureDate?: Date | null;
  expiryDate?: Date | null;
  quantity?: string;
  status?: BatchStatus;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Batch row. */
export interface UpdateBatchProps {
  batchNumber?: string;
  manufactureDate?: Date | null;
  expiryDate?: Date | null;
  quantity?: string;
  status?: BatchStatus;
  updatedBy?: bigint | null;
}
