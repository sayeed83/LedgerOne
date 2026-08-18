import { z } from "zod";
import { WarehouseStatus } from "../../../business/inventory-types";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Warehouse-specific data), mirroring create-product.dto.ts. `branchUuid` is
// a cross-module reference (FK-002) to Organization's `branches.uuid` —
// accepted as client input but never validated for existence here.
// `warehouseCode`/`name`/`description` max lengths mirror the `VARCHAR(32)`/
// `VARCHAR(150)`/`VARCHAR(500)` column widths (inventory.prisma). `status`
// is accepted as a plain, shape-only-validated enum value — the Business
// layer's own `createWarehouse` performs no deactivation-restriction
// validation this milestone (WHS-002 is deferred — no Stock data exists yet
// to evaluate it against), so there is nothing further to enforce here
// either.
export const createWarehouseRequestSchema = z.object({
  branchUuid: z.string().uuid(),
  warehouseCode: z.string().min(1).max(32),
  name: z.string().min(1).max(150),
  description: z.string().min(1).max(500).optional(),
  status: z.nativeEnum(WarehouseStatus).optional(),
});

export type CreateWarehouseRequest = z.infer<typeof createWarehouseRequestSchema>;
