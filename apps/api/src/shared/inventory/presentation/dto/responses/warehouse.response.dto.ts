import { z } from "zod";
import { WarehouseStatus } from "../../../business/inventory-types";

// Never the `Warehouse` Domain entity itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`tenantId`/
// `createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003), mirroring product.response.dto.ts
// exactly.
export const warehouseResponseSchema = z.object({
  uuid: z.string().uuid(),
  branchUuid: z.string().uuid(),
  warehouseCode: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.nativeEnum(WarehouseStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WarehouseResponse = z.infer<typeof warehouseResponseSchema>;

/** Structural rather than importing the Domain `Warehouse` type (Presentation must not import domain/, Ch.9.3). */
interface WarehouseLike {
  uuid: string;
  branchUuid: string;
  warehouseCode: string;
  name: string;
  description: string | null;
  status: WarehouseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toWarehouseResponse(warehouse: WarehouseLike): WarehouseResponse {
  return {
    uuid: warehouse.uuid,
    branchUuid: warehouse.branchUuid,
    warehouseCode: warehouse.warehouseCode,
    name: warehouse.name,
    description: warehouse.description,
    status: warehouse.status,
    createdAt: warehouse.createdAt,
    updatedAt: warehouse.updatedAt,
  };
}
