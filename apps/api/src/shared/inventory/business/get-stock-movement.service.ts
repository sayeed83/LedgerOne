// Business layer — reads a Stock Movement by its external identifier,
// scoped to the supplied Tenant (00_BUSINESS_RULES.md Ch.39). Never resolves
// by the internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside
// this module only ever hold the `uuid`.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { StockMovement } from "../domain/entities/stock-movement.entity";
import { StockMovementNotFoundError } from "../domain/errors/inventory.errors";

export interface GetStockMovementInput {
  tenantId: bigint;
  stockMovementUuid: string;
}

export interface GetStockMovementDeps {
  repository: IInventoryRepository;
}

export async function getStockMovement(input: GetStockMovementInput, deps: GetStockMovementDeps): Promise<StockMovement> {
  const stockMovement = await deps.repository.findStockMovementByUuid(input.tenantId, input.stockMovementUuid);
  if (!stockMovement) {
    throw new StockMovementNotFoundError(input.stockMovementUuid);
  }
  return stockMovement;
}
