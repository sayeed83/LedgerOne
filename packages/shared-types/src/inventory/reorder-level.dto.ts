// Mirrors apps/api/src/shared/inventory/presentation/dto/responses/reorder-level.response.dto.ts
// and dto/requests/{create-reorder-level.dto.ts,update-reorder-level.dto.ts}.
// Flagged known backend gap, identical in shape to Batch's/Stock's/Inventory
// Adjustment's own `productId` (see batch.dto.ts's own header comment):
// `productId` here is a raw internal FK (06_DATABASE_STANDARDS.md PK-003's
// own exception, carried over verbatim from the Business layer's
// `CreateReorderLevelInput`/`UpdateReorderLevelInput` contract), not a
// `productUuid` like every other Inventory cross-entity reference field.
// Serialized as a decimal numeric string, mirroring the backend's own
// `bigint`-to-string mapping (JSON has no native `bigint`).
export interface ReorderLevelResponseDto {
  uuid: string;
  companyUuid: string;
  warehouseUuid: string;
  productId: string;
  reorderLevel: string;
  reorderQuantity: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReorderLevelRequestDto {
  companyUuid: string;
  warehouseUuid: string;
  productId: string;
  reorderLevel: string;
  reorderQuantity: string;
}

// Mirrors the backend's own `update-reorder-level.dto.ts` exactly — only
// `reorderLevel`/`reorderQuantity` are accepted; `companyUuid`/
// `warehouseUuid`/`productId` are not updatable fields on the backend's own
// contract, so they are not exposed here either.
export interface UpdateReorderLevelRequestDto {
  reorderLevel?: string;
  reorderQuantity?: string;
}
