import { z } from "zod";
import { ProductStatus } from "../../../business/inventory-types";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Product-specific data), mirroring create-unit.dto.ts. `companyUuid` is a
// cross-module reference (FK-002) to Organization's `companies.uuid` —
// accepted as client input but never validated for existence here.
// `productCode`/`name`/`description` max lengths mirror the `VARCHAR(32)`/
// `VARCHAR(150)`/`VARCHAR(500)` column widths (inventory.prisma).
// `productCategoryUuid`/`unitUuid` are external identifiers
// (06_DATABASE_STANDARDS.md PK-003), resolved to their internal ids by the
// Business layer. `status` is accepted as a plain, shape-only-validated
// enum value — the Business layer's own `createProduct` performs no
// status-transition validation this milestone (PRD-003/Ch.34.12 are
// deferred — no Stock/transaction data exists yet to evaluate them
// against), so there is nothing further to enforce here either.
export const createProductRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  productCode: z.string().min(1).max(32),
  name: z.string().min(1).max(150),
  description: z.string().min(1).max(500).optional(),
  productCategoryUuid: z.string().uuid(),
  unitUuid: z.string().uuid().optional(),
  isStocked: z.boolean(),
  status: z.nativeEnum(ProductStatus).optional(),
});

export type CreateProductRequest = z.infer<typeof createProductRequestSchema>;
