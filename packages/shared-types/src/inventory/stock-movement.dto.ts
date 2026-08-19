// Mirrors apps/api/src/shared/inventory/presentation/dto/responses/stock-movement.response.dto.ts
// and dto/requests/create-stock-movement.dto.ts. Stock Movement is an
// immutable ledger entity (00_BUSINESS_RULES.md Ch.39.5/STM-002) — there is
// no `UpdateStockMovementRequestDto` here, mirroring the backend's own
// identical absence of an update DTO/endpoint. `productId` is a raw
// internal FK (06_DATABASE_STANDARDS.md PK-003's own exception, carried
// over verbatim from the Business layer's `CreateStockMovementInput`
// contract), identical treatment to Stock's/Inventory Adjustment's own
// `productId`. Serialized as a decimal numeric string, mirroring the
// backend's own `stock-movement.response.dto.ts`'s `bigint`-to-string
// mapping (JSON has no native `bigint`). No `updatedAt` field exists — the
// entity carries no `updatedAt`/`updatedBy` column at all (Ch.39.5/STM-002).
export enum StockMovementType {
  Receipt = "RECEIPT",
  Issue = "ISSUE",
  Transfer = "TRANSFER",
  Adjustment = "ADJUSTMENT",
}

export interface StockMovementResponseDto {
  uuid: string;
  companyUuid: string;
  productId: string;
  sourceWarehouseUuid: string | null;
  destinationWarehouseUuid: string | null;
  movementType: StockMovementType;
  quantity: string;
  referenceType: string | null;
  referenceUuid: string | null;
  createdAt: string;
}

export interface CreateStockMovementRequestDto {
  companyUuid: string;
  productId: string;
  sourceWarehouseUuid?: string;
  destinationWarehouseUuid?: string;
  movementType: StockMovementType;
  quantity: string;
  referenceType?: string;
  referenceUuid?: string;
}
