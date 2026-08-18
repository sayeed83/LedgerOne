// Mirrors apps/api/src/shared/inventory/presentation/dto/responses/warehouse.response.dto.ts
// and dto/requests/{create-warehouse.dto.ts,update-warehouse.dto.ts}. Unlike
// Product's own `ProductResponseDto` (which omits `productCategoryId`/
// `unitId` because they're internal in-module FKs), `branchUuid` is not an
// internal FK — it's the entity's own cross-module reference field, so it
// is echoed back as-is; no known backend gap here (see product.dto.ts's own
// documented gap for contrast).
export enum WarehouseStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
}

export interface WarehouseResponseDto {
  uuid: string;
  branchUuid: string;
  warehouseCode: string;
  name: string;
  description: string | null;
  status: WarehouseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseRequestDto {
  branchUuid: string;
  warehouseCode: string;
  name: string;
  description?: string;
  status?: WarehouseStatus;
}

export interface UpdateWarehouseRequestDto {
  warehouseCode?: string;
  name?: string;
  description?: string | null;
  status?: WarehouseStatus;
}
