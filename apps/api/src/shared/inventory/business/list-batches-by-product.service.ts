// Business layer — lists every Batch belonging to a single Product, across
// every Warehouse (00_BUSINESS_RULES.md Ch.40), scoped to a Tenant. Plain
// Repository passthrough, mirroring
// list-inventory-adjustments-by-product.service.ts's own shape — no FEFO
// ordering (BAT-002) or expiry filtering (BAT-003) applied here.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Batch } from "../domain/entities/batch.entity";

export interface ListBatchesByProductInput {
  tenantId: bigint;
  productId: bigint;
}

export interface ListBatchesByProductDeps {
  repository: IInventoryRepository;
}

export async function listBatchesByProduct(
  input: ListBatchesByProductInput,
  deps: ListBatchesByProductDeps,
): Promise<Batch[]> {
  return deps.repository.listBatchesByProduct(input.tenantId, input.productId);
}
