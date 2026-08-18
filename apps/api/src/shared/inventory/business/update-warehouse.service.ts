// Business layer — revises a Warehouse's code/name/description/status
// (00_BUSINESS_RULES.md Ch.37.5). Re-checks Ch.37.8's per-Branch
// code/name-uniqueness rule only when the relevant field is actually
// changing — mirroring update-product.service.ts's own "only re-check when
// the relevant field changes" pattern — using the same `findWarehouseByCode`
// / `listWarehousesByBranch`-and-scan approach `createWarehouse` uses, since
// no `findWarehouseByName` repository method exists.
//
// `description`/`status` are plain passthrough fields (Prisma's
// `undefined`-leaves-untouched convention).
//
// Deliberately NOT enforced here, per explicit instruction to implement
// only rules the currently existing data model supports: WHS-002 ("cannot
// be deactivated while it holds non-zero Stock") — no Stock (Ch.38) table
// exists yet in this codebase to evaluate it against; `status` is therefore
// accepted and passed straight through with no deactivation-restriction
// check, flagged rather than silently invented, mirroring Product's own
// PRD-003 deferral. Branch existence is likewise not (re-)validated here —
// `branchUuid` is immutable on Warehouse (not an updatable field), and its
// existence was never validated at creation either (a cross-module
// reference, FK-002).
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Warehouse } from "../domain/entities/warehouse.entity";
import { WarehouseStatus } from "../domain/enums/warehouse-status.enum";
import {
  WarehouseNotFoundError,
  DuplicateWarehouseCodeError,
  DuplicateWarehouseNameError,
} from "../domain/errors/inventory.errors";

export interface UpdateWarehouseInput {
  tenantId: bigint;
  warehouseUuid: string;
  warehouseCode?: string;
  name?: string;
  description?: string | null;
  status?: WarehouseStatus;
  updatedBy?: bigint | null;
}

export interface UpdateWarehouseDeps {
  repository: IInventoryRepository;
}

export async function updateWarehouse(input: UpdateWarehouseInput, deps: UpdateWarehouseDeps): Promise<Warehouse> {
  const { repository } = deps;

  const warehouse = await repository.findWarehouseByUuid(input.tenantId, input.warehouseUuid);
  if (!warehouse) {
    throw new WarehouseNotFoundError(input.warehouseUuid);
  }

  if (input.warehouseCode !== undefined && input.warehouseCode !== warehouse.warehouseCode) {
    const existingByCode = await repository.findWarehouseByCode(
      input.tenantId,
      warehouse.branchUuid,
      input.warehouseCode,
    );
    if (existingByCode) {
      throw new DuplicateWarehouseCodeError(warehouse.branchUuid, input.warehouseCode);
    }
  }

  if (input.name !== undefined && input.name !== warehouse.name) {
    const siblings = await repository.listWarehousesByBranch(input.tenantId, warehouse.branchUuid);
    const duplicateName = siblings.some(
      (sibling) => sibling.uuid !== warehouse.uuid && sibling.name === input.name,
    );
    if (duplicateName) {
      throw new DuplicateWarehouseNameError(warehouse.branchUuid, input.name);
    }
  }

  return repository.updateWarehouse(input.tenantId, warehouse.uuid, {
    warehouseCode: input.warehouseCode,
    name: input.name,
    description: input.description,
    status: input.status,
    updatedBy: input.updatedBy ?? null,
  });
}
