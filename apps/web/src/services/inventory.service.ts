import type {
  BatchResponseDto,
  CreateBatchRequestDto,
  CreateInventoryAdjustmentRequestDto,
  CreateProductCategoryRequestDto,
  CreateProductRequestDto,
  CreateStockMovementRequestDto,
  CreateStockRequestDto,
  CreateUnitRequestDto,
  CreateWarehouseRequestDto,
  InventoryAdjustmentResponseDto,
  ProductCategoryResponseDto,
  ProductResponseDto,
  CreateReorderLevelRequestDto,
  ReorderLevelResponseDto,
  UpdateReorderLevelRequestDto,
  StockMovementResponseDto,
  StockResponseDto,
  UnitResponseDto,
  UpdateBatchRequestDto,
  UpdateInventoryAdjustmentRequestDto,
  UpdateProductCategoryRequestDto,
  UpdateProductRequestDto,
  UpdateStockRequestDto,
  UpdateUnitRequestDto,
  UpdateWarehouseRequestDto,
  WarehouseResponseDto,
} from "@ledgerone/shared-types";
import { apiClient } from "./api-client";

interface Envelope<T> {
  data: T;
}

// FLD-004/API-002/ARCH-003: the sole API wrapper for the Inventory module.
// API-004: the active tenant is derived from the JWT by
// `current-tenant.middleware.ts` server-side — no `X-Tenant-Id` header is
// set by this file, mirroring accounting.service.ts's identical reasoning.
// `companyUuid` below is a legitimate request field (which Company a Unit
// belongs to), not the tenant-context concept API-004 forbids passing
// explicitly.

// --- Unit of Measure ---

export async function listUnitsByCompany(companyUuid: string): Promise<UnitResponseDto[]> {
  const response = await apiClient.get<Envelope<UnitResponseDto[]>>("/inventory/units", {
    params: { companyUuid },
  });
  return response.data.data;
}

export async function listBaseUnits(companyUuid: string): Promise<UnitResponseDto[]> {
  const response = await apiClient.get<Envelope<UnitResponseDto[]>>("/inventory/units/base-units", {
    params: { companyUuid },
  });
  return response.data.data;
}

export async function getUnit(unitUuid: string): Promise<UnitResponseDto> {
  const response = await apiClient.get<Envelope<UnitResponseDto>>(`/inventory/units/${unitUuid}`);
  return response.data.data;
}

export async function createUnit(payload: CreateUnitRequestDto): Promise<UnitResponseDto> {
  const response = await apiClient.post<Envelope<UnitResponseDto>>("/inventory/units", payload);
  return response.data.data;
}

export async function updateUnit(unitUuid: string, payload: UpdateUnitRequestDto): Promise<UnitResponseDto> {
  const response = await apiClient.put<Envelope<UnitResponseDto>>(`/inventory/units/${unitUuid}`, payload);
  return response.data.data;
}

// --- Product Category ---

export async function listProductCategoriesByCompany(companyUuid: string): Promise<ProductCategoryResponseDto[]> {
  const response = await apiClient.get<Envelope<ProductCategoryResponseDto[]>>("/inventory/product-categories", {
    params: { companyUuid },
  });
  return response.data.data;
}

export async function getProductCategory(productCategoryUuid: string): Promise<ProductCategoryResponseDto> {
  const response = await apiClient.get<Envelope<ProductCategoryResponseDto>>(
    `/inventory/product-categories/${productCategoryUuid}`,
  );
  return response.data.data;
}

export async function createProductCategory(
  payload: CreateProductCategoryRequestDto,
): Promise<ProductCategoryResponseDto> {
  const response = await apiClient.post<Envelope<ProductCategoryResponseDto>>(
    "/inventory/product-categories",
    payload,
  );
  return response.data.data;
}

export async function updateProductCategory(
  productCategoryUuid: string,
  payload: UpdateProductCategoryRequestDto,
): Promise<ProductCategoryResponseDto> {
  const response = await apiClient.put<Envelope<ProductCategoryResponseDto>>(
    `/inventory/product-categories/${productCategoryUuid}`,
    payload,
  );
  return response.data.data;
}

// --- Product ---

export async function listProductsByCompany(companyUuid: string): Promise<ProductResponseDto[]> {
  const response = await apiClient.get<Envelope<ProductResponseDto[]>>("/inventory/products", {
    params: { companyUuid },
  });
  return response.data.data;
}

export async function getProduct(productUuid: string): Promise<ProductResponseDto> {
  const response = await apiClient.get<Envelope<ProductResponseDto>>(`/inventory/products/${productUuid}`);
  return response.data.data;
}

export async function createProduct(payload: CreateProductRequestDto): Promise<ProductResponseDto> {
  const response = await apiClient.post<Envelope<ProductResponseDto>>("/inventory/products", payload);
  return response.data.data;
}

export async function updateProduct(
  productUuid: string,
  payload: UpdateProductRequestDto,
): Promise<ProductResponseDto> {
  const response = await apiClient.put<Envelope<ProductResponseDto>>(`/inventory/products/${productUuid}`, payload);
  return response.data.data;
}

// --- Warehouse ---

export async function listWarehousesByBranch(branchUuid: string): Promise<WarehouseResponseDto[]> {
  const response = await apiClient.get<Envelope<WarehouseResponseDto[]>>("/inventory/warehouses", {
    params: { branchUuid },
  });
  return response.data.data;
}

export async function getWarehouse(warehouseUuid: string): Promise<WarehouseResponseDto> {
  const response = await apiClient.get<Envelope<WarehouseResponseDto>>(`/inventory/warehouses/${warehouseUuid}`);
  return response.data.data;
}

export async function createWarehouse(payload: CreateWarehouseRequestDto): Promise<WarehouseResponseDto> {
  const response = await apiClient.post<Envelope<WarehouseResponseDto>>("/inventory/warehouses", payload);
  return response.data.data;
}

export async function updateWarehouse(
  warehouseUuid: string,
  payload: UpdateWarehouseRequestDto,
): Promise<WarehouseResponseDto> {
  const response = await apiClient.put<Envelope<WarehouseResponseDto>>(
    `/inventory/warehouses/${warehouseUuid}`,
    payload,
  );
  return response.data.data;
}

// --- Stock ---

export async function listStocksByWarehouse(warehouseUuid: string): Promise<StockResponseDto[]> {
  const response = await apiClient.get<Envelope<StockResponseDto[]>>("/inventory/stocks", {
    params: { warehouseUuid },
  });
  return response.data.data;
}

export async function getStock(stockUuid: string): Promise<StockResponseDto> {
  const response = await apiClient.get<Envelope<StockResponseDto>>(`/inventory/stocks/${stockUuid}`);
  return response.data.data;
}

export async function createStock(payload: CreateStockRequestDto): Promise<StockResponseDto> {
  const response = await apiClient.post<Envelope<StockResponseDto>>("/inventory/stocks", payload);
  return response.data.data;
}

export async function updateStock(stockUuid: string, payload: UpdateStockRequestDto): Promise<StockResponseDto> {
  const response = await apiClient.put<Envelope<StockResponseDto>>(`/inventory/stocks/${stockUuid}`, payload);
  return response.data.data;
}

// --- Inventory Adjustment ---

export async function listInventoryAdjustmentsByWarehouse(
  warehouseUuid: string,
): Promise<InventoryAdjustmentResponseDto[]> {
  const response = await apiClient.get<Envelope<InventoryAdjustmentResponseDto[]>>("/inventory/adjustments", {
    params: { warehouseUuid },
  });
  return response.data.data;
}

export async function getInventoryAdjustment(adjustmentUuid: string): Promise<InventoryAdjustmentResponseDto> {
  const response = await apiClient.get<Envelope<InventoryAdjustmentResponseDto>>(
    `/inventory/adjustments/${adjustmentUuid}`,
  );
  return response.data.data;
}

export async function createInventoryAdjustment(
  payload: CreateInventoryAdjustmentRequestDto,
): Promise<InventoryAdjustmentResponseDto> {
  const response = await apiClient.post<Envelope<InventoryAdjustmentResponseDto>>(
    "/inventory/adjustments",
    payload,
  );
  return response.data.data;
}

export async function updateInventoryAdjustment(
  adjustmentUuid: string,
  payload: UpdateInventoryAdjustmentRequestDto,
): Promise<InventoryAdjustmentResponseDto> {
  const response = await apiClient.put<Envelope<InventoryAdjustmentResponseDto>>(
    `/inventory/adjustments/${adjustmentUuid}`,
    payload,
  );
  return response.data.data;
}

// --- Stock Movement (Ch.39, immutable ledger — no update/remove method exists on the backend, STM-002) ---

export async function listStockMovementsByWarehouse(warehouseUuid: string): Promise<StockMovementResponseDto[]> {
  const response = await apiClient.get<Envelope<StockMovementResponseDto[]>>("/inventory/stock-movements", {
    params: { warehouseUuid },
  });
  return response.data.data;
}

export async function getStockMovement(movementUuid: string): Promise<StockMovementResponseDto> {
  const response = await apiClient.get<Envelope<StockMovementResponseDto>>(
    `/inventory/stock-movements/${movementUuid}`,
  );
  return response.data.data;
}

export async function createStockMovement(
  payload: CreateStockMovementRequestDto,
): Promise<StockMovementResponseDto> {
  const response = await apiClient.post<Envelope<StockMovementResponseDto>>("/inventory/stock-movements", payload);
  return response.data.data;
}

// --- Batch (Ch.40) ---

export async function listBatchesByWarehouse(warehouseUuid: string): Promise<BatchResponseDto[]> {
  const response = await apiClient.get<Envelope<BatchResponseDto[]>>("/inventory/batches", {
    params: { warehouseUuid },
  });
  return response.data.data;
}

export async function getBatch(batchUuid: string): Promise<BatchResponseDto> {
  const response = await apiClient.get<Envelope<BatchResponseDto>>(`/inventory/batches/${batchUuid}`);
  return response.data.data;
}

export async function createBatch(payload: CreateBatchRequestDto): Promise<BatchResponseDto> {
  const response = await apiClient.post<Envelope<BatchResponseDto>>("/inventory/batches", payload);
  return response.data.data;
}

export async function updateBatch(batchUuid: string, payload: UpdateBatchRequestDto): Promise<BatchResponseDto> {
  const response = await apiClient.put<Envelope<BatchResponseDto>>(`/inventory/batches/${batchUuid}`, payload);
  return response.data.data;
}

// --- Reorder Level (Ch.42) ---

export async function listReorderLevelsByCompany(companyUuid: string): Promise<ReorderLevelResponseDto[]> {
  const response = await apiClient.get<Envelope<ReorderLevelResponseDto[]>>("/inventory/reorder-levels", {
    params: { companyUuid },
  });
  return response.data.data;
}

export async function listReorderLevelsByWarehouse(warehouseUuid: string): Promise<ReorderLevelResponseDto[]> {
  const response = await apiClient.get<Envelope<ReorderLevelResponseDto[]>>("/inventory/reorder-levels/by-warehouse", {
    params: { warehouseUuid },
  });
  return response.data.data;
}

export async function getReorderLevel(reorderLevelUuid: string): Promise<ReorderLevelResponseDto> {
  const response = await apiClient.get<Envelope<ReorderLevelResponseDto>>(
    `/inventory/reorder-levels/${reorderLevelUuid}`,
  );
  return response.data.data;
}

export async function createReorderLevel(
  payload: CreateReorderLevelRequestDto,
): Promise<ReorderLevelResponseDto> {
  const response = await apiClient.post<Envelope<ReorderLevelResponseDto>>("/inventory/reorder-levels", payload);
  return response.data.data;
}

export async function updateReorderLevel(
  reorderLevelUuid: string,
  payload: UpdateReorderLevelRequestDto,
): Promise<ReorderLevelResponseDto> {
  const response = await apiClient.put<Envelope<ReorderLevelResponseDto>>(
    `/inventory/reorder-levels/${reorderLevelUuid}`,
    payload,
  );
  return response.data.data;
}
