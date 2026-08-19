// Business layer — records a new Stock Movement (00_BUSINESS_RULES.md
// Ch.39): the immutable ledger record of any event that changes Stock
// (Ch.38) quantity — a Receipt, an Issue, a Transfer, or an Adjustment. This
// service creates the movement RECORD only.
//
// The one validation Ch.39 itself supports without depending on a future
// module: Ch.39.8 ("A Receipt/Transfer-in movement must specify a valid
// destination Warehouse") and STM-003 ("A Transfer movement... must record
// both the decrease at the source Warehouse and the increase at the
// destination Warehouse as one atomic movement") together require that the
// Warehouse field(s) a given `movementType` needs are actually supplied —
// RECEIPT needs `destinationWarehouseUuid`, ISSUE needs
// `sourceWarehouseUuid`, TRANSFER needs both — enforced via
// `StockMovementMissingRequiredWarehouseError`. ADJUSTMENT has no
// Ch.39.8-stated Warehouse-side requirement (Ch.44's own direction, via
// `AdjustmentType`, lives on a different table entirely) and is not
// constrained here — not silently invented.
//
// Deliberately NOT done here, per this milestone's own explicit
// instruction: no Stock quantity is read or modified (STM-001 — "there is
// no path to change Stock quantity without a corresponding movement
// record" describes what a movement enables, not an obligation this
// service itself carries out), no Journal Entry is created (Ch.39.14), no
// approval-threshold workflow is evaluated (Ch.39.13/Ch.13), and
// Issue/Transfer-out's "must satisfy Stock availability... unless backorder
// policy applies" (Ch.39.8) is not checked — it depends on Stock's (Ch.38)
// on-hand quantity, a future cross-entity Business-layer concern, mirroring
// every other Inventory create service's deferral of a rule it cannot yet
// evaluate. `companyUuid` (cross-module reference), `sourceWarehouseUuid`/
// `destinationWarehouseUuid` (cross-module/in-module uuid references), and
// `productId` (real, in-module FK) are not validated for existence here,
// mirroring every other Inventory create service's handling of its own
// cross-reference fields. `updateStockMovement` does not exist and is never
// called here — STM-002 makes the record immutable once created.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { StockMovement } from "../domain/entities/stock-movement.entity";
import { StockMovementType } from "../domain/enums/stock-movement-type.enum";
import { StockMovementMissingRequiredWarehouseError } from "../domain/errors/inventory.errors";

export interface CreateStockMovementInput {
  tenantId: bigint;
  companyUuid: string;
  productId: bigint;
  sourceWarehouseUuid?: string | null;
  destinationWarehouseUuid?: string | null;
  movementType: StockMovementType;
  quantity: string;
  referenceType?: string | null;
  referenceUuid?: string | null;
  createdBy?: bigint | null;
}

export interface CreateStockMovementDeps {
  repository: IInventoryRepository;
}

function validateRequiredWarehouses(
  movementType: StockMovementType,
  sourceWarehouseUuid: string | null,
  destinationWarehouseUuid: string | null,
): void {
  switch (movementType) {
    case StockMovementType.Receipt:
      if (!destinationWarehouseUuid) {
        throw new StockMovementMissingRequiredWarehouseError(movementType, "a destination Warehouse");
      }
      break;
    case StockMovementType.Issue:
      if (!sourceWarehouseUuid) {
        throw new StockMovementMissingRequiredWarehouseError(movementType, "a source Warehouse");
      }
      break;
    case StockMovementType.Transfer:
      if (!sourceWarehouseUuid || !destinationWarehouseUuid) {
        throw new StockMovementMissingRequiredWarehouseError(movementType, "both a source and a destination Warehouse");
      }
      break;
    case StockMovementType.Adjustment:
      // Ch.39.8 states no Warehouse-side requirement for Adjustment — not checked here.
      break;
  }
}

export async function createStockMovement(
  input: CreateStockMovementInput,
  deps: CreateStockMovementDeps,
): Promise<StockMovement> {
  const sourceWarehouseUuid = input.sourceWarehouseUuid ?? null;
  const destinationWarehouseUuid = input.destinationWarehouseUuid ?? null;

  validateRequiredWarehouses(input.movementType, sourceWarehouseUuid, destinationWarehouseUuid);

  return deps.repository.createStockMovement(input.tenantId, {
    companyUuid: input.companyUuid,
    productId: input.productId,
    sourceWarehouseUuid,
    destinationWarehouseUuid,
    movementType: input.movementType,
    quantity: input.quantity,
    referenceType: input.referenceType ?? null,
    referenceUuid: input.referenceUuid ?? null,
    createdBy: input.createdBy ?? null,
  });
}
