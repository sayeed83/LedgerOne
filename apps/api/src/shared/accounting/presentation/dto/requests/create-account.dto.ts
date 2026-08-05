import { z } from "zod";
import { AccountType } from "../../../business/accounting-types";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Account-specific data), mirroring create-account-group.dto.ts.
// `companyUuid` is a cross-module reference (FK-002) to Organization's
// `companies.uuid` — accepted as client input but never validated for
// existence here. `code`/`name` max lengths mirror the `VARCHAR(20)`/
// `VARCHAR(150)` column widths (accounting.prisma). `accountGroupUuid`/
// `parentAccountUuid` are external identifiers (06_DATABASE_STANDARDS.md
// PK-003), resolved to their internal ids by the Business layer.
export const createAccountRequestSchema = z.object({
  companyUuid: z.string().uuid(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(150),
  accountType: z.nativeEnum(AccountType),
  accountGroupUuid: z.string().uuid(),
  parentAccountUuid: z.string().uuid().optional(),
  isPostingAccount: z.boolean().optional(),
});

export type CreateAccountRequest = z.infer<typeof createAccountRequestSchema>;
