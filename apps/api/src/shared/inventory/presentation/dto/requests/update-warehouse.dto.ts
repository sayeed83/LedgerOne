import { z } from "zod";
import { WarehouseStatus } from "../../../business/inventory-types";

// `description` is `nullable().optional()` — the same documented, minimal
// choice update-product.dto.ts made for its own `description` field:
// distinguishes "omit the field, leave the existing value untouched"
// (`undefined`) from "explicitly clear it" (`null`), matching the Business
// layer's own `update-warehouse.service.ts` input contract exactly.
// `branchUuid` has no field here at all — it is immutable on Warehouse (not
// an updatable field), mirroring `updateWarehouse`'s own contract. `status`
// is accepted with no deactivation-restriction validation, for the same
// reason create-warehouse.dto.ts's own `status` field carries none
// (WHS-002 deferred).
export const updateWarehouseRequestSchema = z.object({
  warehouseCode: z.string().min(1).max(32).optional(),
  name: z.string().min(1).max(150).optional(),
  description: z.string().min(1).max(500).nullable().optional(),
  status: z.nativeEnum(WarehouseStatus).optional(),
});

export type UpdateWarehouseRequest = z.infer<typeof updateWarehouseRequestSchema>;
