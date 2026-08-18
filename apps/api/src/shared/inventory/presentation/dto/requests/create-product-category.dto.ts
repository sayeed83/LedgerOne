import { z } from "zod";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Product-Category-specific data), mirroring Accounting's
// create-account-group.dto.ts. `companyUuid` is a cross-module reference
// (FK-002) to Organization's `companies.uuid` — accepted as client input but
// never validated for existence here, mirroring create-account-group.dto.ts's
// own handling. `name` max length mirrors the `VARCHAR(100)` column width
// (inventory.prisma). `parentProductCategoryUuid` is the external Product
// Category identifier (06_DATABASE_STANDARDS.md PK-003), resolved to its
// internal id by the Business layer. `defaultTaxGroupUuid` is a further
// cross-module reference (FK-002) to Accounting's `tax_groups.uuid`
// (00_BUSINESS_RULES.md Ch.35.3/PCT-002) — likewise accepted but never
// validated for existence here.
export const createProductCategoryRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  name: z.string().min(1).max(100),
  parentProductCategoryUuid: z.string().uuid().optional(),
  defaultTaxGroupUuid: z.string().uuid().optional(),
});

export type CreateProductCategoryRequest = z.infer<typeof createProductCategoryRequestSchema>;
