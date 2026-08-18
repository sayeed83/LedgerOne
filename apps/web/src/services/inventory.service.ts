import type {
  CreateProductRequestDto,
  CreateStockRequestDto,
  CreateUnitRequestDto,
  CreateWarehouseRequestDto,
  ProductCategoryResponseDto,
  ProductResponseDto,
  StockResponseDto,
  UnitResponseDto,
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

// --- Product Category (minimal, read-only) ---
// Product Category has no frontend of its own yet — this one read method
// exists only so Product's own ProductCategorySelect can list Product
// Categories for a Company, not as part of a Product Category frontend.

export async function listProductCategoriesByCompany(companyUuid: string): Promise<ProductCategoryResponseDto[]> {
  const response = await apiClient.get<Envelope<ProductCategoryResponseDto[]>>("/inventory/product-categories", {
    params: { companyUuid },
  });
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
