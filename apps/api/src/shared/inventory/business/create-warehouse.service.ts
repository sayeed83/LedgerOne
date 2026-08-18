// Business layer — defines a new Warehouse within a Branch
// (00_BUSINESS_RULES.md Ch.37.1). Ch.37.8 ("Warehouse name must be unique
// within its Branch") is enforced here for both the identifying code and
// the name — `warehouseCode` via `findWarehouseByCode` (mirroring
// create-product.service.ts's own `findProductByCode` duplicate-code check),
// and `name` via `listWarehousesByBranch` + an in-memory scan (mirroring
// create-product-category.service.ts's own duplicate-name check, since no
// `findWarehouseByName` repository method exists — the Repository milestone
// gave Warehouse the same six methods Product/Unit/Product Category
// started with, and name-uniqueness there is likewise resolved by listing
// siblings, not a dedicated by-name lookup).
//
// `branchUuid` is a cross-module reference (FK-002) to Organization's
// `branches.uuid` (WHS-001/Ch.37.9/37.10 — Warehouse's real parent is
// Branch, not Company, per the Database milestone's own flagged Handbook
// Deviation); its existence is not validated here, mirroring every other
// Inventory create service's `companyUuid` handling — this Business layer
// depends only on `IInventoryRepository`, never on Organization's own
// repository.
//
// Deliberately NOT enforced here, per explicit instruction to implement
// only rules the currently existing data model supports: WHS-002 ("cannot
// be deactivated while it holds non-zero Stock") and WHS-003 ("a Company
// must have at least one Warehouse if any Product is Stocked") — neither
// Stock (Ch.38) nor a Company-wide Warehouse count exists yet in this
// codebase to evaluate them against. Both flagged, not silently invented,
// mirroring Product's own PRD-003/Ch.34.12 deferral.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Warehouse } from "../domain/entities/warehouse.entity";
import { WarehouseStatus } from "../domain/enums/warehouse-status.enum";
import { DuplicateWarehouseCodeError, DuplicateWarehouseNameError } from "../domain/errors/inventory.errors";

export interface CreateWarehouseInput {
  tenantId: bigint;
  branchUuid: string;
  warehouseCode: string;
  name: string;
  description?: string | null;
  status?: WarehouseStatus;
  createdBy?: bigint | null;
}

export interface CreateWarehouseDeps {
  repository: IInventoryRepository;
}

export async function createWarehouse(input: CreateWarehouseInput, deps: CreateWarehouseDeps): Promise<Warehouse> {
  const { repository } = deps;

  const existingByCode = await repository.findWarehouseByCode(input.tenantId, input.branchUuid, input.warehouseCode);
  if (existingByCode) {
    throw new DuplicateWarehouseCodeError(input.branchUuid, input.warehouseCode);
  }

  const siblings = await repository.listWarehousesByBranch(input.tenantId, input.branchUuid);
  const duplicateName = siblings.some((warehouse) => warehouse.name === input.name);
  if (duplicateName) {
    throw new DuplicateWarehouseNameError(input.branchUuid, input.name);
  }

  return repository.createWarehouse(input.tenantId, {
    branchUuid: input.branchUuid,
    warehouseCode: input.warehouseCode,
    name: input.name,
    description: input.description ?? null,
    status: input.status,
    createdBy: input.createdBy ?? null,
  });
}
