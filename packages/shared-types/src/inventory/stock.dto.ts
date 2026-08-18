// Mirrors apps/api/src/shared/inventory/presentation/dto/responses/stock.response.dto.ts
// and dto/requests/{create-stock.dto.ts,update-stock.dto.ts}. Flagged known
// backend gap (more severe than Product's own `productCategoryUuid`/
// `unitUuid` omission): `productId` here is a raw internal FK
// (06_DATABASE_STANDARDS.md PK-003's own exception, carried over verbatim
// from the Business layer's `CreateStockInput`/`UpdateStockInput` contract —
// see those services' own header comments), not a `productUuid` like every
// other Inventory cross-entity reference field (`branchUuid`,
// `productCategoryUuid`, `unitUuid`, `warehouseUuid` itself). Serialized as
// a decimal numeric string, mirroring the backend's own
// `stock.response.dto.ts`'s `bigint`-to-string mapping (JSON has no native
// `bigint`). No Stock-specific enum exists (Stock has no status/lifecycle).
export interface StockResponseDto {
  uuid: string;
  companyUuid: string;
  warehouseUuid: string;
  productId: string;
  quantityOnHand: string;
  quantityReserved: string;
  quantityAvailable: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockRequestDto {
  companyUuid: string;
  warehouseUuid: string;
  productId: string;
  quantityOnHand?: string;
  quantityReserved?: string;
  quantityAvailable?: string;
}

export interface UpdateStockRequestDto {
  warehouseUuid?: string;
  productId?: string;
  quantityOnHand?: string;
  quantityReserved?: string;
  quantityAvailable?: string;
}
