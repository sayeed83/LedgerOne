import { z } from "zod";
import { AccountStatus } from "../../../business/accounting-types";

// `companyUuid`/`accountGroupUuid`/`status` are optional query filters
// narrowing the tenant-wide list, mirroring list-tax-rules-query.dto.ts's
// optional-filter shape.
export const listAccountsQuerySchema = z.object({
  companyUuid: z.string().uuid().optional(),
  accountGroupUuid: z.string().uuid().optional(),
  status: z.nativeEnum(AccountStatus).optional(),
});

export type ListAccountsQuery = z.infer<typeof listAccountsQuerySchema>;
