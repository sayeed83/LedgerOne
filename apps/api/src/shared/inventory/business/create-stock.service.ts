// Business layer — defines a new Stock record for a Product in a Warehouse
// (00_BUSINESS_RULES.md Ch.38.1). STK-003 ("Stock is tracked independently
// per Product per Warehouse — at most one Stock row per Product per
// Warehouse") is enforced here via `findStockByWarehouseAndProduct`,
// mirroring create-warehouse.service.ts's own `findWarehouseByCode`
// duplicate-code check, using `StockAlreadyExistsError`.
//
// `companyUuid`/`warehouseUuid` are cross-module/in-module uuid-reference
// fields (FK-002); `productId` is a real, in-module FK — none of the three
// is validated for existence here (no Warehouse-existence, Product-existence,
// or Company-validation), mirroring every other Inventory create service's
// handling of its own cross-module/FK reference fields. This service depends
// only on `IInventoryRepository`.
//
// Deliberately NOT enforced here, per explicit instruction to implement only
// the rules the currently existing data model supports: on-hand/reserved/
// available arithmetic (STK-001), negative-stock prevention, reservation,
// stock movement, inventory adjustment, transfer, costing/valuation — none
// of those has a supporting mechanism (Stock Movement, Inventory Adjustment)
// in this codebase yet. Flagged, not silently invented, mirroring Product's
// own PRD-003/Ch.34.12 and Warehouse's own WHS-002/WHS-003 deferrals.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Stock } from "../domain/entities/stock.entity";
import { StockAlreadyExistsError } from "../domain/errors/inventory.errors";

export interface CreateStockInput {
  tenantId: bigint;
  companyUuid: string;
  warehouseUuid: string;
  productId: bigint;
  quantityOnHand?: string;
  quantityReserved?: string;
  quantityAvailable?: string;
  createdBy?: bigint | null;
}

export interface CreateStockDeps {
  repository: IInventoryRepository;
}

export async function createStock(input: CreateStockInput, deps: CreateStockDeps): Promise<Stock> {
  const { repository } = deps;

  const existing = await repository.findStockByWarehouseAndProduct(input.tenantId, input.warehouseUuid, input.productId);
  if (existing) {
    throw new StockAlreadyExistsError(input.warehouseUuid, input.productId);
  }

  return repository.createStock(input.tenantId, {
    companyUuid: input.companyUuid,
    warehouseUuid: input.warehouseUuid,
    productId: input.productId,
    quantityOnHand: input.quantityOnHand,
    quantityReserved: input.quantityReserved,
    quantityAvailable: input.quantityAvailable,
    createdBy: input.createdBy ?? null,
  });
}
