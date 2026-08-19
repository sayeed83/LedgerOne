// Mirrors apps/api/src/shared/inventory/presentation/dto/responses/inventory-adjustment.response.dto.ts
// and dto/requests/{create-inventory-adjustment.dto.ts,update-inventory-adjustment.dto.ts}.
// Flagged known backend gap, identical in shape to Stock's own
// `productId` (see stock.dto.ts's own header comment): `productId` here is
// a raw internal FK (06_DATABASE_STANDARDS.md PK-003's own exception,
// carried over verbatim from the Business layer's
// `CreateInventoryAdjustmentInput`/`UpdateInventoryAdjustmentInput`
// contract), not a `productUuid` like every other Inventory cross-entity
// reference field. Serialized as a decimal numeric string, mirroring the
// backend's own `inventory-adjustment.response.dto.ts`'s `bigint`-to-string
// mapping (JSON has no native `bigint`).
export enum AdjustmentType {
  Increase = "INCREASE",
  Decrease = "DECREASE",
}

export interface InventoryAdjustmentResponseDto {
  uuid: string;
  companyUuid: string;
  warehouseUuid: string;
  productId: string;
  adjustmentType: AdjustmentType;
  quantity: string;
  reason: string;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryAdjustmentRequestDto {
  companyUuid: string;
  warehouseUuid: string;
  productId: string;
  adjustmentType: AdjustmentType;
  quantity: string;
  reason: string;
  remarks?: string;
}

// Mirrors the backend's own `update-inventory-adjustment.dto.ts` exactly —
// only `quantity`/`reason`/`remarks` are accepted; `adjustmentType` is
// deliberately not part of the backend's Update surface even though the
// Business layer would accept it, so it is not exposed here either.
export interface UpdateInventoryAdjustmentRequestDto {
  quantity?: string;
  reason?: string;
  remarks?: string | null;
}
