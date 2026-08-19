import { StockMovementType } from "../enums/stock-movement-type.enum";

// Domain entity for a Stock Movement (00_BUSINESS_RULES.md Ch.39) — "the
// record of any event that changes Stock (Ch.38) quantity — a Receipt
// (incoming), an Issue (outgoing), a Transfer (between Warehouses), or an
// Adjustment (Ch.44)," forming the complete, immutable history Stock's
// current quantity is derived from (Ch.39.1). Tenant-owned
// (06_DATABASE_STANDARDS.md MT-001), carrying `companyUuid` as a
// cross-module uuid-reference field (FK-002, no DB-level FK, mirroring
// Stock's/Inventory Adjustment's own treatment) and `productId` as a real,
// in-module FK to this module's own Product (inventory.prisma FK-001).
//
// `sourceWarehouseUuid`/`destinationWarehouseUuid` are both nullable
// cross-module uuid-reference fields (FK-002, no DB-level FK) implementing
// Ch.39.10's ERD literally — two independent Warehouse relationships on the
// same row, required to make STM-003's single-atomic-Transfer rule
// representable at all (see inventory.prisma's own file-level comment on
// `StockMovement` for the full reasoning).
//
// No transition/mutation methods, and no update/remove counterpart at the
// Repository layer — mirroring `LedgerEntry`'s (accounting/domain/entities/
// ledger-entry.entity.ts) identical immutability posture exactly: Ch.39.5
// ("created and immediately final — like a Ledger entry... immutable once
// recorded") and STM-002 ("immutable once recorded — correction requires a
// new, offsetting Stock Movement, never a direct edit") are the same rule as
// Ch.19's own LDG-002. `createdBy` is nullable for the same reason
// `LedgerEntry.createdBy` is: attributable to a system-triggered posting
// process, not always a direct human action.
//
// `quantity` is a DECIMAL(18,6) column (inventory.prisma) mapped to a plain
// fixed-point string, mirroring Stock's/Inventory Adjustment's own
// quantity-field mapping — a cross-module Domain import of a shared
// `DecimalValue` type is architecturally forbidden at this layer (see
// unit.entity.ts's own header comment).
export class StockMovement {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly productId: bigint,
    public readonly sourceWarehouseUuid: string | null,
    public readonly destinationWarehouseUuid: string | null,
    public readonly movementType: StockMovementType,
    public readonly quantity: string,
    public readonly referenceType: string | null,
    public readonly referenceUuid: string | null,
    public readonly createdAt: Date,
    public readonly createdBy: bigint | null,
  ) {}
}

/** Fields required to persist a new Stock Movement row; identity/`createdAt` are assigned by the database. There is no update/remove counterpart (STM-002). */
export interface CreateStockMovementProps {
  companyUuid: string;
  productId: bigint;
  sourceWarehouseUuid?: string | null;
  destinationWarehouseUuid?: string | null;
  movementType: StockMovementType;
  quantity: string;
  referenceType?: string | null;
  referenceUuid?: string | null;
  createdBy?: bigint | null;
}
