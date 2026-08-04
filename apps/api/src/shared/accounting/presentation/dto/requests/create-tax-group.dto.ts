import { z } from "zod";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Tax-Group-specific data), mirroring create-financial-year.dto.ts.
// `companyUuid` is a cross-module reference (FK-002) to Organization's
// `companies.uuid` — accepted as client input but never validated for
// existence here, mirroring create-financial-year.dto.ts's own handling.
// `name` max length mirrors the `VARCHAR(100)` column width
// (accounting.prisma).
export const createTaxGroupRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  name: z.string().min(1).max(100),
});

export type CreateTaxGroupRequest = z.infer<typeof createTaxGroupRequestSchema>;
