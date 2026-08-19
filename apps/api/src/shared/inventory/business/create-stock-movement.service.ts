// Business layer — records a new Stock Movement (00_BUSINESS_RULES.md
// Ch.39): the immutable ledger record of any event that changes Stock
// (Ch.38) quantity — a Receipt, an Issue, a Transfer, or an Adjustment —
// and, per Ch.39.7 STM-001/Ch.38.5, propagates that change to the affected
// Stock row(s)' `quantityOnHand`/`quantityAvailable` atomically (Gap #1 of
// the approved Inventory gap analysis).
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
// Sequence, inside ONE `ITransactionRunner.run` (05_CODING_STANDARDS.md
// Ch.20.3 — "a use case that writes to more than one table must wrap those
// writes in a single Prisma `$transaction`", mirroring Accounting's own
// `postJournalEntry` exactly):
// 1. Create the immutable Stock Movement row (STM-002 — never updated).
// 2. If `sourceWarehouseUuid` is populated, decrease that (Warehouse,
//    Product) pair's Stock by `quantity` (STM-003's "decrease at the source
//    Warehouse").
// 3. If `destinationWarehouseUuid` is populated, increase that pair's Stock
//    by `quantity` (STM-003's "increase at the destination Warehouse").
// Both steps 2/3 run for a TRANSFER (STM-003's single-atomic-movement
// requirement); only one runs for a RECEIPT/ISSUE; neither runs for an
// ADJUSTMENT with no Warehouse supplied at all (Ch.39.8) — that movement
// type's real Stock effect is Ch.44's own, not-yet-built ADJ-002
// orchestration, explicitly out of scope for this milestone. Either write
// failing rolls back the whole transaction, so a Stock Movement can never
// be recorded without its Stock effect landing, and vice versa.
//
// Deliberately NOT done here, per this milestone's own explicit
// instruction: no negative-stock prevention (STK-001), no reservation
// arithmetic (STK-002), no Journal Entry (Ch.39.14/Ch.44's ADJ-002), no
// approval-threshold workflow (Ch.39.13/Ch.13), no Inventory Adjustment
// logic (Ch.44), and no Stock Valuation (Ch.43) — all explicitly deferred,
// each a separate, larger milestone of its own per the approved gap
// analysis. `companyUuid` (cross-module reference), `sourceWarehouseUuid`/
// `destinationWarehouseUuid` (cross-module/in-module uuid references), and
// `productId` (real, in-module FK) are not validated for existence here,
// mirroring every other Inventory create service's handling of its own
// cross-reference fields. `updateStockMovement` does not exist and is never
// called here — STM-002 makes the record immutable once created.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { ITransactionRunner } from "../domain/interfaces/transaction-runner.interface";
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
  transactionRunner: ITransactionRunner;
}

/** Flips a non-negative fixed-point decimal string's sign via plain string manipulation — never floating-point arithmetic, so DECIMAL(18,6) precision is preserved exactly. `quantity` itself is a positive magnitude (Ch.39.3); this is the source side's "decrease" (STM-003). */
function negateQuantity(quantity: string): string {
  return quantity.startsWith("-") ? quantity.slice(1) : `-${quantity}`;
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

  return deps.transactionRunner.run(async (tx) => {
    const movement = await deps.repository.createStockMovement(
      input.tenantId,
      {
        companyUuid: input.companyUuid,
        productId: input.productId,
        sourceWarehouseUuid,
        destinationWarehouseUuid,
        movementType: input.movementType,
        quantity: input.quantity,
        referenceType: input.referenceType ?? null,
        referenceUuid: input.referenceUuid ?? null,
        createdBy: input.createdBy ?? null,
      },
      tx,
    );

    if (sourceWarehouseUuid) {
      await deps.repository.applyStockQuantityDelta(
        input.tenantId,
        input.companyUuid,
        sourceWarehouseUuid,
        input.productId,
        negateQuantity(input.quantity),
        tx,
      );
    }

    if (destinationWarehouseUuid) {
      await deps.repository.applyStockQuantityDelta(
        input.tenantId,
        input.companyUuid,
        destinationWarehouseUuid,
        input.productId,
        input.quantity,
        tx,
      );
    }

    return movement;
  });
}
