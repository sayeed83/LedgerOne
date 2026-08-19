// Mirrors apps/api/src/shared/inventory/presentation/dto/responses/batch.response.dto.ts
// and dto/requests/{create-batch.dto.ts,update-batch.dto.ts}.
// Flagged known backend gap, identical in shape to Stock's/Inventory
// Adjustment's own `productId` (see stock.dto.ts's/inventory-adjustment.dto.ts's
// own header comments): `productId` here is a raw internal FK
// (06_DATABASE_STANDARDS.md PK-003's own exception, carried over verbatim
// from the Business layer's `CreateBatchInput`/`UpdateBatchInput`
// contract), not a `productUuid` like every other Inventory cross-entity
// reference field. Serialized as a decimal numeric string, mirroring the
// backend's own `bigint`-to-string mapping (JSON has no native `bigint`).
// `manufactureDate`/`expiryDate` are serialized as ISO date-time strings
// (or `null`) over JSON — the backend's own Zod response schema types them
// as `Date`, but HTTP/JSON carries no native `Date` type.
export enum BatchStatus {
  Active = "ACTIVE",
  Depleted = "DEPLETED",
  Expired = "EXPIRED",
  Disposed = "DISPOSED",
}

export interface BatchResponseDto {
  uuid: string;
  companyUuid: string;
  productId: string;
  warehouseUuid: string;
  batchNumber: string;
  manufactureDate: string | null;
  expiryDate: string | null;
  quantity: string;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchRequestDto {
  companyUuid: string;
  productId: string;
  warehouseUuid: string;
  batchNumber: string;
  manufactureDate?: string;
  expiryDate?: string;
  quantity?: string;
  status?: BatchStatus;
}

// Mirrors the backend's own `update-batch.dto.ts` exactly — only
// `batchNumber`/`manufactureDate`/`expiryDate`/`quantity`/`status` are
// accepted; `companyUuid`/`productId`/`warehouseUuid` are not updatable
// fields on the backend's own contract, so they are not exposed here
// either.
export interface UpdateBatchRequestDto {
  batchNumber?: string;
  manufactureDate?: string | null;
  expiryDate?: string | null;
  quantity?: string;
  status?: BatchStatus;
}
