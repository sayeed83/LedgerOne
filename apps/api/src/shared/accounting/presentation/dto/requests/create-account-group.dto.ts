import { z } from "zod";
import { AccountType } from "../../../business/accounting-types";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Account-Group-specific data), mirroring create-tax-group.dto.ts.
// `companyUuid` is a cross-module reference (FK-002) to Organization's
// `companies.uuid` — accepted as client input but never validated for
// existence here, mirroring create-tax-group.dto.ts's own handling.
// `name` max length mirrors the `VARCHAR(100)` column width
// (accounting.prisma). `parentAccountGroupUuid` is the external Account
// Group identifier (06_DATABASE_STANDARDS.md PK-003), resolved to its
// internal id by the Business layer.
export const createAccountGroupRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  name: z.string().min(1).max(100),
  accountType: z.nativeEnum(AccountType),
  parentAccountGroupUuid: z.string().uuid().optional(),
});

export type CreateAccountGroupRequest = z.infer<typeof createAccountGroupRequestSchema>;
