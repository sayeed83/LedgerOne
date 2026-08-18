// Business layer — revises a Stock record's quantities, and re-validates
// STK-003's Warehouse/Product uniqueness whenever a caller supplies a
// `warehouseUuid`/`productId` that differs from the Stock's current one,
// mirroring update-warehouse.service.ts's own "only re-check when the
// relevant field is actually changing" pattern (via
// `findStockByWarehouseAndProduct`, throwing `StockAlreadyExistsError` when
// another Stock row already occupies that pair). When both are unchanged
// (or not supplied), the uniqueness lookup is skipped entirely.
//
// `quantityOnHand`/`quantityReserved`/`quantityAvailable`/`updatedBy` are
// the only fields actually persisted by `repository.updateStock` — the
// Repository layer's `UpdateStockProps` has no `warehouseUuid`/`productId`
// fields (Stock's identity pair is not a Repository-supported mutation),
// so a `warehouseUuid`/`productId` supplied here is used only for this
// service's own STK-003 re-validation, never passed through to persistence.
// Flagged, not silently invented — a real Warehouse/Product transfer for an
// existing Stock row belongs to a later milestone (Warehouse Transfer),
// mirroring Product's own PRD-003/Ch.34.12 and Warehouse's own
// WHS-002/WHS-003 deferrals.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Stock } from "../domain/entities/stock.entity";
import { StockNotFoundError, StockAlreadyExistsError } from "../domain/errors/inventory.errors";

export interface UpdateStockInput {
  tenantId: bigint;
  stockUuid: string;
  warehouseUuid?: string;
  productId?: bigint;
  quantityOnHand?: string;
  quantityReserved?: string;
  quantityAvailable?: string;
  updatedBy?: bigint | null;
}

export interface UpdateStockDeps {
  repository: IInventoryRepository;
}

export async function updateStock(input: UpdateStockInput, deps: UpdateStockDeps): Promise<Stock> {
  const { repository } = deps;

  const stock = await repository.findStockByUuid(input.tenantId, input.stockUuid);
  if (!stock) {
    throw new StockNotFoundError(input.stockUuid);
  }

  const warehouseUuidChanged = input.warehouseUuid !== undefined && input.warehouseUuid !== stock.warehouseUuid;
  const productIdChanged = input.productId !== undefined && input.productId !== stock.productId;

  if (warehouseUuidChanged || productIdChanged) {
    const effectiveWarehouseUuid = input.warehouseUuid ?? stock.warehouseUuid;
    const effectiveProductId = input.productId ?? stock.productId;

    const existing = await repository.findStockByWarehouseAndProduct(
      input.tenantId,
      effectiveWarehouseUuid,
      effectiveProductId,
    );
    if (existing && existing.uuid !== stock.uuid) {
      throw new StockAlreadyExistsError(effectiveWarehouseUuid, effectiveProductId);
    }
  }

  return repository.updateStock(input.tenantId, stock.uuid, {
    quantityOnHand: input.quantityOnHand,
    quantityReserved: input.quantityReserved,
    quantityAvailable: input.quantityAvailable,
    updatedBy: input.updatedBy ?? null,
  });
}
