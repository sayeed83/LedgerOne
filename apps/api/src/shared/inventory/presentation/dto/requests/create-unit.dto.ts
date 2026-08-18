import { z } from "zod";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Unit-specific data), mirroring create-product-category.dto.ts.
// `companyUuid` is a cross-module reference (FK-002) to Organization's
// `companies.uuid` — accepted as client input but never validated for
// existence here. `name`/`symbol` max lengths mirror the `VARCHAR(100)`/
// `VARCHAR(20)` column widths (inventory.prisma). `baseUnitUuid` is the
// external Unit identifier (06_DATABASE_STANDARDS.md PK-003), resolved to
// its internal id by the Business layer. `conversionFactor` is validated
// only for non-empty shape here — the actual decimal-format/positivity
// invariant (Ch.36.8) is enforced once, by the Business layer's own
// `isPositiveDecimalString` check, not duplicated as a second regex here,
// mirroring create-exchange-rate.dto.ts's identical reasoning for `rate`.
export const createUnitRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(20),
  baseUnitUuid: z.string().uuid().optional(),
  conversionFactor: z.string().min(1).optional(),
});

export type CreateUnitRequest = z.infer<typeof createUnitRequestSchema>;
