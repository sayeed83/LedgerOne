import { z } from "zod";
import { WarehouseStatus } from "@ledgerone/shared-types";
import { uuidSchema } from "./shared.schema";

// Mirrors the backend's create/update-warehouse.dto.ts field shapes/limits
// exactly (warehouseCode VARCHAR(32), name VARCHAR(150), description
// VARCHAR(500) per inventory.prisma) — no invented validation rules.
export const warehouseFormSchema = z.object({
  branchUuid: uuidSchema,
  warehouseCode: z
    .string()
    .min(1, "Warehouse code is required.")
    .max(32, "Warehouse code must be at most 32 characters."),
  name: z.string().min(1, "Name is required.").max(150, "Name must be at most 150 characters."),
  description: z.string().max(500, "Description must be at most 500 characters.").optional(),
  status: z.nativeEnum(WarehouseStatus, { errorMap: () => ({ message: "Select a status." }) }),
});

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;
