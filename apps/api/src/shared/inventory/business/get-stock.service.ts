// Business layer — reads a Stock record by its external identifier, scoped
// to the supplied Tenant (00_BUSINESS_RULES.md Ch.38.1). Never resolves by
// the internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Stock } from "../domain/entities/stock.entity";
import { StockNotFoundError } from "../domain/errors/inventory.errors";

export interface GetStockInput {
  tenantId: bigint;
  stockUuid: string;
}

export interface GetStockDeps {
  repository: IInventoryRepository;
}

export async function getStock(input: GetStockInput, deps: GetStockDeps): Promise<Stock> {
  const stock = await deps.repository.findStockByUuid(input.tenantId, input.stockUuid);
  if (!stock) {
    throw new StockNotFoundError(input.stockUuid);
  }
  return stock;
}
